from sqlalchemy import Column, String, Float, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid
import enum

class ExpenseType(str, enum.Enum):
    debit  = "debit"
    credit = "credit"

class ExpenseSource(str, enum.Enum):
    manual = "manual"
    auto   = "auto"

class Expense(Base):
    __tablename__ = "expenses"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id     = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    description = Column(String, nullable=False)
    amount      = Column(Float, nullable=False)
    category    = Column(String, nullable=False)
    emoji       = Column(String, default="📦")
    date        = Column(String, nullable=False)
    type        = Column(Enum(ExpenseType), default=ExpenseType.debit)
    source      = Column(Enum(ExpenseSource), default=ExpenseSource.manual)
    upi_ref          = Column(String, nullable=True)
    gmail_message_id = Column(String, nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="expenses")