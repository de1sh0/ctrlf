from sqlalchemy import Column, String, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import uuid

class Budget(Base):
    __tablename__ = "budgets"

    id       = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id  = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    category = Column(String, nullable=False)
    emoji    = Column(String, default="📦")
    limit    = Column(Float, nullable=False)

    user = relationship("User", back_populates="budgets")