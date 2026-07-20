from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.budget import Budget
from app.schemas.budget import BudgetUpdate, BudgetOut
from app.core.deps import get_current_user
from app.models.user import User
from typing import List

router = APIRouter(prefix="/api/budgets", tags=["budgets"])

DEFAULT_BUDGETS = [
    {"category": "Food & Dining",     "emoji": "🍔", "limit": 8000},
    {"category": "Transport",          "emoji": "🚗", "limit": 6000},
    {"category": "Groceries",          "emoji": "🛒", "limit": 7000},
    {"category": "Shopping",           "emoji": "🛍️", "limit": 5000},
    {"category": "Entertainment",      "emoji": "🎬", "limit": 3000},
    {"category": "Health",             "emoji": "💊", "limit": 3000},
    {"category": "Bills & Utilities",  "emoji": "💡", "limit": 5000},
    {"category": "Education",          "emoji": "📚", "limit": 5000},
    {"category": "Travel",             "emoji": "✈️", "limit": 10000},
    {"category": "Other",              "emoji": "📦", "limit": 2000},
]

def get_or_create_budgets(db: Session, user_id: str) -> List[Budget]:
    existing = db.query(Budget).filter(Budget.user_id == user_id).all()
    existing_cats = {b.category for b in existing}

    for default in DEFAULT_BUDGETS:
        if default["category"] not in existing_cats:
            db.add(Budget(
                user_id=user_id,
                category=default["category"],
                emoji=default["emoji"],
                limit=default["limit"],
            ))
    db.commit()
    return db.query(Budget).filter(Budget.user_id == user_id).all()

@router.get("", response_model=List[BudgetOut])
def get_budgets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_or_create_budgets(db, str(current_user.id))

@router.patch("/{budget_id}", response_model=BudgetOut)
def update_budget(
    budget_id: str,
    payload: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id,
    ).first()
    if not budget:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Budget not found")
    budget.limit = payload.limit
    db.commit()
    db.refresh(budget)
    return budget