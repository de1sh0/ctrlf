from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
import random
import string

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserOut, Token, MFAVerify
from app.core.security import hash_password, verify_password, create_access_token
from app.core.deps import get_current_user
from app.services.email_service import send_mfa_code, send_welcome_email

router = APIRouter(prefix="/api/auth", tags=["auth"])


def generate_otp(length: int = 6) -> str:
    return "".join(random.choices(string.digits, k=length))


@router.post("/signup", response_model=Token)
def signup(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=payload.name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        is_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return Token(access_token=token, token_type="bearer", user=UserOut.from_orm(user))





@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(user.id)})
    return Token(access_token=token, token_type="bearer", user=UserOut.from_orm(user))


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/settings")
def update_settings(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update user settings: total_monthly_budget, bank_alert_emails"""
    if "total_monthly_budget" in payload:
        current_user.total_monthly_budget = payload["total_monthly_budget"]
    if "bank_alert_emails" in payload:
        current_user.bank_alert_emails = payload["bank_alert_emails"]
    db.commit()
    db.refresh(current_user)
    return {
        "total_monthly_budget": current_user.total_monthly_budget,
        "bank_alert_emails": current_user.bank_alert_emails,
    }


@router.get("/settings")
def get_settings(current_user: User = Depends(get_current_user)):
    return {
        "total_monthly_budget": current_user.total_monthly_budget,
        "bank_alert_emails": current_user.bank_alert_emails or [],
    }