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


@router.post("/signup")
def signup(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    code = generate_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    user = User(
        name=payload.name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        is_verified=False,
        mfa_code=code,
        mfa_code_expires_at=expires_at,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    send_mfa_code(user.email, code)

    return {"message": "Verification code sent to your email", "email": user.email}


@router.post("/verify-mfa", response_model=Token)
def verify_mfa(payload: MFAVerify, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.is_verified:
        raise HTTPException(status_code=400, detail="Account already verified")

    if not user.mfa_code or user.mfa_code != payload.code:
        raise HTTPException(status_code=400, detail="Invalid verification code")

    now_utc = datetime.now(timezone.utc)
    expires = user.mfa_code_expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if now_utc > expires:
        raise HTTPException(status_code=400, detail="Verification code expired")

    user.is_verified = True
    user.mfa_code = None
    user.mfa_code_expires_at = None
    db.commit()
    db.refresh(user)

    send_welcome_email(user.email, user.name)

    token = create_access_token({"sub": str(user.id)})
    return Token(access_token=token, token_type="bearer", user=UserOut.from_orm(user))


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_verified:
        raise HTTPException(
            status_code=403,
            detail="Email not verified. Please check your inbox for the verification code."
        )

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