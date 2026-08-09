import os
import json
import base64
import re
from datetime import datetime
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from sqlalchemy.orm import Session
from app.models.gmail_token import GmailToken
from app.models.expense import Expense, ExpenseType, ExpenseSource
from app.models.merchant_rule import MerchantRule
from app.models.user import User
from app.services.nlp_parser import parse_bank_email
from app.services.email_service import send_budget_alert as _send_budget_alert

CREDENTIALS_FILE = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "../../credentials.json"
)
SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]
DEFAULT_BANK_SENDERS = [
    "alerts@hdfcbank.bank.in",
    "alerts@hdfcbank.com",
    "hdfcbank@hdfcbank.net",
    "noreply@hdfcbank.com",
    "notification@hdfcbank.com",
]


def get_credentials_for_user(token: GmailToken) -> Credentials:
    with open(CREDENTIALS_FILE) as f:
        client_config = json.load(f)["web"]
    creds = Credentials(
        token=token.access_token,
        refresh_token=token.refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=client_config["client_id"],
        client_secret=client_config["client_secret"],
        scopes=SCOPES,
    )
    return creds


def refresh_token_if_needed(creds: Credentials, token: GmailToken, db: Session) -> Credentials:
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
        token.access_token = creds.token
        db.commit()
    return creds


def get_email_text(msg: dict) -> str:
    """Extract text from email — tries plain text, then HTML, then snippet."""
    payload = msg.get("payload", {})

    def decode_data(data: str) -> str:
        if not data:
            return ""
        try:
            return base64.urlsafe_b64decode(data).decode("utf-8", errors="ignore")
        except Exception:
            return ""

    def strip_html(html: str) -> str:
        clean = re.sub(r'<[^>]+>', ' ', html)
        clean = re.sub(r'\s+', ' ', clean)
        return clean.strip()

    def extract_from_payload(p: dict) -> str:
        mime = p.get("mimeType", "")
        body_data = p.get("body", {}).get("data", "")

        if mime == "text/plain" and body_data:
            return decode_data(body_data)

        if mime == "text/html" and body_data:
            return strip_html(decode_data(body_data))

        for part in p.get("parts", []):
            result = extract_from_payload(part)
            if result:
                return result

        return ""

    text = extract_from_payload(payload)

    # Fallback to snippet if body is empty
    if not text:
        text = msg.get("snippet", "")

    return text


def sync_gmail_for_user(user_id: str, db: Session) -> int:
    token = db.query(GmailToken).filter(GmailToken.user_id == user_id).first()
    if not token:
        print(f"[Gmail] No token for user {user_id}")
        return 0

    # Determine which bank senders to filter by
    user = db.query(User).filter(User.id == user_id).first()
    bank_senders = (
        user.bank_alert_emails
        if user and user.bank_alert_emails
        else DEFAULT_BANK_SENDERS
    )
    print(f"[Gmail] Using bank senders: {bank_senders}")

    try:
        creds = get_credentials_for_user(token)
        creds = refresh_token_if_needed(creds, token, db)
        service = build("gmail", "v1", credentials=creds)

        # Load ALL existing upi_refs and msg_ids for this user upfront
        existing_expenses = db.query(Expense).filter(
            Expense.user_id == user_id,
            Expense.source == ExpenseSource.auto,
        ).all()

        existing_upi_refs = {e.upi_ref for e in existing_expenses if e.upi_ref}
        existing_msg_ids  = {e.gmail_message_id for e in existing_expenses if e.gmail_message_id}

        print(f"[Gmail] Already have {len(existing_upi_refs)} UPI refs in DB")
        print(f"[Gmail] Existing refs: {existing_upi_refs}")

        # Load merchant rules for this user into a fast lookup dict
        merchant_rules = db.query(MerchantRule).filter(
            MerchantRule.user_id == user_id
        ).all()
        rules_map = {
            rule.merchant_name.lower(): (rule.category, rule.emoji)
            for rule in merchant_rules
        }
        print(f"[Gmail] Loaded {len(rules_map)} merchant rules")

        # Fetch from the 1st of the current month
        now = datetime.now()
        since_date = now.replace(day=1).strftime("%Y/%m/%d")
        sender_query = " OR ".join([f"from:{s}" for s in bank_senders])
        query = f"({sender_query}) after:{since_date}"
        print(f"[Gmail] Query: {query}")

        messages = []
        page_token = None
        while True:
            result = service.users().messages().list(
                userId="me", q=query, maxResults=500, pageToken=page_token
            ).execute()
            messages.extend(result.get("messages", []))
            page_token = result.get("nextPageToken")
            if not page_token:
                break

        print(f"[Gmail] Found {len(messages)} emails")

        new_count = 0

        for msg_ref in messages:
            # Fast check — skip if msg_id already processed
            if msg_ref["id"] in existing_msg_ids:
                print(f"[Gmail] Skipping {msg_ref['id']} — msg_id already in DB")
                continue

            msg = service.users().messages().get(
                userId="me", id=msg_ref["id"], format="full"
            ).execute()

            headers = msg.get("payload", {}).get("headers", [])
            subject = next((h["value"] for h in headers if h["name"] == "Subject"), "")
            date_str = next((h["value"] for h in headers if h["name"] == "Date"), None)

            text = get_email_text(msg)
            print(f"[Gmail] Subject: {subject}")
            print(f"[Gmail] Text: {text[:150]}")

            if not text:
                continue

            parsed = parse_bank_email(text)
            if not parsed:
                print(f"[Gmail] Not a transaction — skipping")
                continue

            # Apply merchant memory rule if one exists
            merchant_key = parsed["description"].lower()
            if merchant_key in rules_map:
                saved_category, saved_emoji = rules_map[merchant_key]
                print(f"[Gmail] 🧠 Merchant rule found for '{parsed['description']}' → {saved_category}")
                parsed["category"] = saved_category
                parsed["emoji"] = saved_emoji

            upi_ref = parsed.get("upi_ref")
            print(f"[Gmail] UPI ref: {upi_ref}")

            # Skip if UPI ref already saved
            if upi_ref and upi_ref in existing_upi_refs:
                print(f"[Gmail] Skipping — UPI ref {upi_ref} already in DB")
                continue

            # Parse date
            try:
                from email.utils import parsedate_to_datetime
                email_date = parsedate_to_datetime(date_str).strftime("%Y-%m-%d")
            except Exception:
                email_date = datetime.now().strftime("%Y-%m-%d")

            # Save
            expense = Expense(
                user_id=user_id,
                description=parsed["description"],
                amount=parsed["amount"],
                category=parsed["category"],
                emoji=parsed["emoji"],
                date=email_date,
                type=ExpenseType.debit if parsed["type"] == "debit" else ExpenseType.credit,
                source=ExpenseSource.auto,
                gmail_message_id=msg_ref["id"],
                upi_ref=upi_ref,
            )
            db.add(expense)

            # Add to local sets so we don't duplicate within same sync
            if upi_ref:
                existing_upi_refs.add(upi_ref)
            existing_msg_ids.add(msg_ref["id"])

            new_count += 1
            print(f"[Gmail] ✅ Saved: {parsed['description']} ₹{parsed['amount']} (ref: {upi_ref})")

        db.commit()
        print(f"[Gmail] Done — {new_count} new expenses added")

        # After sync, check if a budget alert should fire
        if new_count > 0 and user and user.total_monthly_budget:
            from app.api.expenses import check_and_send_budget_alert
            check_and_send_budget_alert(user, db)

        return new_count

    except HttpError as e:
        print(f"[Gmail] API error: {e}")
        return 0
    except Exception as e:
        print(f"[Gmail] Error: {e}")
        import traceback
        traceback.print_exc()
        return 0