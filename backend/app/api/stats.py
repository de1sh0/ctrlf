from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.expense import Expense, ExpenseType
from app.models.budget import Budget
from app.core.deps import get_current_user
from app.models.user import User
import calendar

router = APIRouter(prefix="/api/stats", tags=["stats"])

@router.get("/monthly")
def monthly_stats(
    month: int,
    year: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prefix = f"{year}-{str(month).zfill(2)}"

    expenses = db.query(Expense).filter(
        Expense.user_id == current_user.id,
        Expense.date.startswith(prefix),
        Expense.type == ExpenseType.debit,
    ).all()

    all_expenses = db.query(Expense).filter(
        Expense.user_id == current_user.id,
        Expense.date.startswith(prefix),
    ).all()

    # Get real budget total from DB
    budgets = db.query(Budget).filter(
        Budget.user_id == current_user.id
    ).all()
    total_budget = sum(b.limit for b in budgets) if budgets else 33000

    total_spent = sum(e.amount for e in expenses)
    auto_synced = sum(1 for e in all_expenses if e.source == "auto")

    # Top category
    cat_totals: dict = {}
    for e in expenses:
        cat_totals[e.category] = cat_totals.get(e.category, 0) + e.amount
    top_category = max(cat_totals, key=cat_totals.get) if cat_totals else "N/A"

    days_in_month = calendar.monthrange(year, month)[1]
    daily_average = round(total_spent / days_in_month, 2)

    return {
        "total_spent": total_spent,
        "remaining": max(total_budget - total_spent, 0),
        "transaction_count": len(expenses),
        "daily_average": daily_average,
        "top_category": top_category,
        "auto_synced_count": auto_synced,
    }