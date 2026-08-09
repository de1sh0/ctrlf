from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models.expense import Expense, ExpenseType
from app.models.merchant_rule import MerchantRule
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseOut
from app.core.deps import get_current_user
from app.models.user import User
from app.services.email_service import send_budget_alert

router = APIRouter(prefix="/api/expenses", tags=["expenses"])

ALERT_THRESHOLDS = [25, 50, 75, 100]


def check_and_send_budget_alert(user: User, db: Session):
    """Check if a monthly budget threshold was crossed and send alert if needed."""
    if not user.total_monthly_budget:
        return

    now = datetime.now()
    prefix = f"{now.year}-{str(now.month).zfill(2)}"
    total_spent = (
        db.query(sql_func.sum(Expense.amount))
        .filter(
            Expense.user_id == user.id,
            Expense.type == ExpenseType.debit,
            Expense.date.startswith(prefix),
        )
        .scalar()
        or 0.0
    )

    pct = (total_spent / user.total_monthly_budget) * 100

    alerts_sent = dict(user.alerts_sent or {})

    for threshold in sorted(ALERT_THRESHOLDS, reverse=True):
        if pct >= threshold:
            alert_key = f"{now.year}_{now.month}_{threshold}"
            if alerts_sent.get(alert_key):
                break  # already sent this threshold this month

            print(f"[Budget] Sending {threshold}% alert to {user.email}")
            send_budget_alert(
                to_email=user.email,
                name=user.name,
                threshold=threshold,
                current_spending=total_spent,
                budget=user.total_monthly_budget,
            )

            # Mark as sent and persist
            alerts_sent[alert_key] = True
            user.alerts_sent = alerts_sent  # reassign to trigger SQLAlchemy change detection
            db.commit()
            break


@router.get("", response_model=List[ExpenseOut])
def get_expenses(
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Expense).filter(Expense.user_id == current_user.id)
    if month and year:
        prefix = f"{year}-{str(month).zfill(2)}"
        query = query.filter(Expense.date.startswith(prefix))
    return query.order_by(Expense.date.desc()).all()


@router.post("", response_model=ExpenseOut, status_code=201)
def create_expense(
    payload: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    expense = Expense(**payload.model_dump(), user_id=current_user.id)
    db.add(expense)
    db.commit()
    db.refresh(expense)

    # Check budget alerts after saving
    if expense.type == ExpenseType.debit:
        check_and_send_budget_alert(current_user, db)

    return expense

@router.patch("/{expense_id}", response_model=ExpenseOut)
def update_expense(
    expense_id: str,
    payload: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(expense, field, value)

    # If user changed the category, auto-save a merchant rule
    if "category" in update_data and expense.description:
        new_category = update_data["category"]
        new_emoji = update_data.get("emoji", expense.emoji)

        existing_rule = db.query(MerchantRule).filter(
            MerchantRule.user_id == current_user.id,
            MerchantRule.merchant_name == expense.description
        ).first()

        if existing_rule:
            existing_rule.category = new_category
            existing_rule.emoji = new_emoji
            print(f"[Rules] Updated rule: '{expense.description}' → {new_category}")
        else:
            new_rule = MerchantRule(
                user_id=current_user.id,
                merchant_name=expense.description,
                category=new_category,
                emoji=new_emoji,
            )
            db.add(new_rule)
            print(f"[Rules] Saved new rule: '{expense.description}' → {new_category}")

    db.commit()
    db.refresh(expense)
    return expense

@router.delete("/{expense_id}")
def delete_expense(
    expense_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    db.delete(expense)
    db.commit()
    return {"message": "Deleted successfully"}