from pydantic import BaseModel
from typing import Optional, Literal
from uuid import UUID
from datetime import datetime

class ExpenseCreate(BaseModel):
    description: str
    amount: float
    category: str
    emoji: str = "📦"
    date: str
    type: Literal["debit", "credit"] = "debit"

class ExpenseUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    emoji: Optional[str] = None
    date: Optional[str] = None
    type: Optional[Literal["debit", "credit"]] = None

class ExpenseOut(BaseModel):
    id: UUID
    description: str
    amount: float
    category: str
    emoji: str
    date: str
    type: str
    source: str
    created_at: datetime

    class Config:
        from_attributes = True