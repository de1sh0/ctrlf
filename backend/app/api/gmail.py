import json
import os
import secrets
import hashlib
import base64
from fastapi import APIRouter, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.gmail_token import GmailToken
from app.services.gmail_service import sync_gmail_for_user
from app.config import settings
import requests as req

router = APIRouter(prefix="/api/gmail", tags=["gmail"])

SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]

# In-memory store for state + PKCE verifier
_auth_store: dict[str, dict] = {}


def get_redirect_uri() -> str:
    """Returns the OAuth redirect URI, always using the configured BACKEND_URL."""
    return f"{settings.BACKEND_URL}/api/gmail/callback"


def get_client_config() -> dict:
    """
    Returns OAuth client config from environment variables (preferred for production)
    or falls back to credentials.json for local development.
    """
    if settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET:
        return {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
        }

    # Fallback: load from credentials.json (local dev only)
    credentials_file = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "../../credentials.json"
    )
    if os.path.exists(credentials_file):
        with open(credentials_file) as f:
            return json.load(f)["web"]

    raise RuntimeError(
        "Google OAuth credentials not found. "
        "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET env vars, "
        "or provide a credentials.json file."
    )


def generate_pkce_pair():
    """Generate PKCE code_verifier and code_challenge."""
    code_verifier = base64.urlsafe_b64encode(
        secrets.token_bytes(32)
    ).rstrip(b"=").decode("utf-8")

    code_challenge = base64.urlsafe_b64encode(
        hashlib.sha256(code_verifier.encode()).digest()
    ).rstrip(b"=").decode("utf-8")

    return code_verifier, code_challenge


@router.get("/connect")
def connect_gmail(
    current_user: User = Depends(get_current_user),
):
    config = get_client_config()
    state = secrets.token_urlsafe(24)
    code_verifier, code_challenge = generate_pkce_pair()

    _auth_store[state] = {
        "user_id": str(current_user.id),
        "code_verifier": code_verifier,
    }

    from urllib.parse import urlencode
    params = {
        "client_id": config["client_id"],
        "redirect_uri": get_redirect_uri(),
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
    }

    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    return {"auth_url": auth_url}


@router.get("/callback")
def gmail_callback(
    code: str,
    state: str,
    db: Session = Depends(get_db),
):
    stored = _auth_store.pop(state, None)
    frontend_url = settings.FRONTEND_URL

    if not stored:
        return RedirectResponse(url=f"{frontend_url}/gmail?error=invalid_state")

    user_id = stored["user_id"]
    code_verifier = stored["code_verifier"]

    try:
        config = get_client_config()

        response = req.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": config["client_id"],
                "client_secret": config["client_secret"],
                "redirect_uri": get_redirect_uri(),
                "grant_type": "authorization_code",
                "code_verifier": code_verifier,
            }
        )

        token_json = response.json()
        print(f"Token response: {token_json}")

        if "error" in token_json:
            print(f"Token error: {token_json}")
            return RedirectResponse(
                url=f"{frontend_url}/gmail?error={token_json['error']}"
            )

        access_token = token_json.get("access_token")
        refresh_token = token_json.get("refresh_token")

        if not access_token:
            return RedirectResponse(url=f"{frontend_url}/gmail?error=no_token")

        # Save to DB
        existing = db.query(GmailToken).filter(
            GmailToken.user_id == user_id
        ).first()

        if existing:
            existing.access_token = access_token
            if refresh_token:
                existing.refresh_token = refresh_token
        else:
            db.add(GmailToken(
                user_id=user_id,
                access_token=access_token,
                refresh_token=refresh_token,
            ))

        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.gmail_connected = True

        db.commit()
        print(f"Gmail connected for user {user_id}")

    except Exception as e:
        print(f"OAuth callback error: {e}")
        import traceback
        traceback.print_exc()
        return RedirectResponse(url=f"{frontend_url}/gmail?error=callback_failed")

    return RedirectResponse(url=f"{frontend_url}/gmail?connected=true")


@router.post("/sync")
def manual_sync(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count = sync_gmail_for_user(str(current_user.id), db)
    return {"synced": count, "message": f"Synced {count} new transactions"}


@router.get("/status")
def gmail_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    token = db.query(GmailToken).filter(
        GmailToken.user_id == current_user.id
    ).first()
    return {
        "connected": token is not None,
        "gmail_email": token.email if token else None,
    }


@router.delete("/disconnect")
def disconnect_gmail(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    token = db.query(GmailToken).filter(
        GmailToken.user_id == current_user.id
    ).first()
    if token:
        db.delete(token)
    current_user.gmail_connected = False
    db.commit()
    return {"message": "Gmail disconnected"}