from pydantic import BaseModel, EmailStr
from uuid import UUID
from typing import Optional, List

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class MFAVerify(BaseModel):
    email: EmailStr
    code: str

class UserOut(BaseModel):
    id: UUID
    name: str
    email: str
    gmail_connected: bool
    is_verified: bool
    total_monthly_budget: Optional[float] = None
    bank_alert_emails: Optional[List[str]] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut