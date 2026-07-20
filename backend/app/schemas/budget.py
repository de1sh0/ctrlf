from pydantic import BaseModel
from uuid import UUID

class BudgetUpdate(BaseModel):
    limit: float

class BudgetOut(BaseModel):
    id: UUID
    category: str
    emoji: str
    limit: float

    class Config:
        from_attributes = True