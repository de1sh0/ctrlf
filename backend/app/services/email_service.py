import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings

def send_email(to_email: str, subject: str, body_text: str):
    """Utility function to send an email via SMTP"""
    if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        print(f"SMTP not configured. Mock sending email to {to_email}: {subject}")
        return

    msg = MIMEMultipart()
    msg['From'] = settings.SMTP_USERNAME
    msg['To'] = to_email
    msg['Subject'] = subject

    msg.attach(MIMEText(body_text, 'plain'))

    try:
        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"Email sent successfully to {to_email}")
    except Exception as e:
        print(f"Failed to send email to {to_email}: {str(e)}")

def send_mfa_code(to_email: str, code: str):
    subject = "Your Paisa Verification Code"
    body = f"Welcome to Paisa! Your verification code is: {code}\n\nThis code will expire in 10 minutes."
    send_email(to_email, subject, body)

def send_welcome_email(to_email: str, name: str):
    subject = "Welcome to Paisa!"
    body = f"Hi {name},\n\nYour email has been verified. Welcome to Paisa, the smart expense tracker!\n\nBest,\nPaisa Team"
    send_email(to_email, subject, body)

def send_budget_alert(to_email: str, name: str, threshold: int, current_spending: float, budget: float):
    subject = f"Paisa Budget Alert: {threshold}% Reached"
    body = (
        f"Hi {name},\n\n"
        f"You have reached {threshold}% of your monthly budget.\n"
        f"Current Spending: {current_spending}\n"
        f"Total Budget: {budget}\n\n"
        f"Keep an eye on your expenses!\n\n"
        f"Best,\nPaisa Team"
    )
    send_email(to_email, subject, body)
