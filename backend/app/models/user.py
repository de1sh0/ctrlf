from sqlalchemy import Column, String, DateTime, Boolean, Float, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid

class User(Base):
    __tablename__ = "users"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name          = Column(String, nullable=False)
    email         = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    is_active     = Column(Boolean, default=True)
    gmail_connected = Column(Boolean, default=False)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    updated_at    = Column(DateTime(timezone=True), onupdate=func.now())
    
    # New fields for MFA, Budget, and Bank Emails
    total_monthly_budget = Column(Float, nullable=True)
    bank_alert_emails = Column(JSON, nullable=True)
    is_verified = Column(Boolean, default=False)
    mfa_code = Column(String, nullable=True)
    mfa_code_expires_at = Column(DateTime(timezone=True), nullable=True)
    # Tracks which budget alert thresholds (25/50/75/100) were emailed per month
    # Format: {"2026_8_25": true, "2026_8_50": true}
    alerts_sent = Column(JSON, nullable=True, default=dict)

    expenses = relationship("Expense", back_populates="user", cascade="all, delete-orphan")
    budgets  = relationship("Budget",  back_populates="user", cascade="all, delete-orphan")