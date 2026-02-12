"""CLI to send a test email to all users with notifications enabled."""
import argparse
import os
import sys
import smtplib
from email.message import EmailMessage
from urllib.parse import urlparse

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from dotenv import dotenv_values

ENV_PATH = os.path.join(os.path.dirname(__file__), "..", ".env")
env = dotenv_values(ENV_PATH)

SMTP_HOST = env.get("SMTP_HOST")
SMTP_PORT = int(env.get("SMTP_PORT", "587"))
SMTP_FROM = env.get("SMTP_FROM_EMAIL")
SMTP_USER = env.get("SMTP_USERNAME")
SMTP_PASS = env.get("SMTP_PASSWORD")
SMTP_TLS = env.get("SMTP_USE_TLS", "true").lower() == "true"
DB_URL = env.get("DATABASE_URL_SYNC")


def get_notified_users():
    import psycopg2
    parsed = urlparse(DB_URL)
    conn = psycopg2.connect(
        host=parsed.hostname,
        port=parsed.port or 5432,
        dbname=parsed.path.lstrip("/"),
        user=parsed.username,
        password=parsed.password,
    )
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT ua.email_address
            FROM user_accounts ua
            JOIN user_job_preferences ujp ON ua.user_id = ujp.user_account_id
            WHERE ujp.notification_enabled = TRUE
        """)
        return [row[0] for row in cur.fetchall()]
    finally:
        conn.close()


def send_test_email(recipient):
    msg = EmailMessage()
    msg["Subject"] = "Who Is Hiring — Test Notification"
    msg["From"] = SMTP_FROM
    msg["To"] = recipient
    msg.set_content(
        "This is a test email from Who Is Hiring.\n\n"
        "If you received this, your email notifications are working correctly."
    )
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as smtp:
        if SMTP_TLS:
            smtp.starttls()
        if SMTP_USER and SMTP_PASS:
            smtp.login(SMTP_USER, SMTP_PASS)
        smtp.send_message(msg)


def main():
    parser = argparse.ArgumentParser(description="Send a test email to users")
    parser.add_argument("--to", help="Send to a specific email instead of all notified users")
    parser.add_argument("--dry-run", action="store_true", help="List recipients without sending")
    args = parser.parse_args()

    print(f"SMTP host: {SMTP_HOST}")
    print(f"From:      {SMTP_FROM}")
    print()

    if args.to:
        recipients = [args.to]
    else:
        recipients = get_notified_users()

    if not recipients:
        print("No users with notifications enabled.")
        return

    print(f"Recipients ({len(recipients)}):")
    for email in recipients:
        print(f"  - {email}")
    print()

    if args.dry_run:
        print("Dry run — no emails sent.")
        return

    for email in recipients:
        try:
            send_test_email(email)
            print(f"  Sent to {email}")
        except Exception as e:
            print(f"  FAILED {email}: {e}")

    print("\nDone.")


if __name__ == "__main__":
    main()
