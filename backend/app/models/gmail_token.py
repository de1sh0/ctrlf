from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base
import uuid

class GmailToken(Base):
    __tablename__ = "gmail_tokens"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id       = Column(UUID(as_uuid=True), unique=True, nullable=False)
    access_token  = Column(Text, nullable=False)
    refresh_token = Column(Text, nullable=True)
    token_expiry  = Column(DateTime(timezone=True), nullable=True)
    email         = Column(String, nullable=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    updated_at    = Column(DateTime(timezone=True), onupdate=func.now())