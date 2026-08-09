from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base
import uuid


class MerchantRule(Base):
    __tablename__ = "merchant_rules"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id         = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    merchant_name   = Column(String, nullable=False)
    category        = Column(String, nullable=False)
    emoji           = Column(String, default="📦")
    updated_at      = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # One rule per merchant per user
    __table_args__ = (
        UniqueConstraint("user_id", "merchant_name", name="uq_user_merchant"),
    )
