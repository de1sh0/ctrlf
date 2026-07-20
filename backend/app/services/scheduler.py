from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.gmail_token import GmailToken
from app.services.gmail_service import sync_gmail_for_user

scheduler = BackgroundScheduler()

def sync_all_users():
    """Run Gmail sync for all connected users."""
    db: Session = SessionLocal()
    try:
        tokens = db.query(GmailToken).all()
        for token in tokens:
            count = sync_gmail_for_user(str(token.user_id), db)
            if count > 0:
                print(f"Auto-synced {count} expenses for user {token.user_id}")
    except Exception as e:
        print(f"Scheduler error: {e}")
    finally:
        db.close()

def start_scheduler():
    scheduler.add_job(
        sync_all_users,
        trigger=IntervalTrigger(minutes=5),
        id="gmail_sync",
        replace_existing=True,
    )
    scheduler.start()
    print("Gmail sync scheduler started — runs every 5 minutes")

def stop_scheduler():
    scheduler.shutdown()