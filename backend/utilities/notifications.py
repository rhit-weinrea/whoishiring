from __future__ import annotations
import logging
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from backend.data_models.models import UserAccount, UserJobPreferences, JobPosting


import asyncio
from dataclasses import dataclass
from email.message import EmailMessage
import smtplib
from typing import Iterable, List

from backend.core.configuration import fetch_environment_config
from backend.data_models.models import JobPosting, UserJobPreferences

logger = logging.getLogger(__name__)

async def send_daily_notifications(session: AsyncSession):
    # Get all users with notifications enabled
    users_stmt = select(UserAccount).where(UserAccount.is_active_user == True)
    users = (await session.execute(users_stmt)).scalars().all()
    now = datetime.now(timezone.utc)
    for user in users:
        prefs_stmt = select(UserJobPreferences).where(UserJobPreferences.user_account_id == user.user_id)
        prefs = (await session.execute(prefs_stmt)).scalar_one_or_none()
        if not prefs or not prefs.notification_enabled:
            continue
        # Only send if not notified today
        last_notified = prefs.last_notified_timestamp
        if last_notified and last_notified.date() == now.date():
            continue
        # Find new jobs since last notification
        jobs_stmt = select(JobPosting).where(
            JobPosting.parsed_timestamp > (last_notified or now - timedelta(days=1))
        )
        jobs = (await session.execute(jobs_stmt)).scalars().all()
        matched_jobs = [job for job in jobs if job_matches_preferences(job, prefs)]
        if matched_jobs:
            await send_notification_email(user.email_address, matched_jobs)
            prefs.last_notified_timestamp = now
            await session.commit()
            logger.info("Sent notification to %s for %d job(s)", user.email_address, len(matched_jobs))



@dataclass
class NotificationMatch:
    job: JobPosting


def _lower_set(values: Iterable[str] | None) -> set[str]:
    return {value.lower() for value in values or [] if value}


def job_matches_preferences(job: JobPosting, prefs: UserJobPreferences) -> bool:
    if prefs.remote_only and (job.remote_status or "").lower() != "remote":
        return False

    if prefs.preferred_locations:
        location = (job.job_location or "").lower()
        if not any(loc.lower() in location for loc in prefs.preferred_locations if loc):
            return False

    if prefs.preferred_tech_stack:
        job_tech = _lower_set(job.tech_stack)
        pref_tech = _lower_set(prefs.preferred_tech_stack)
        if pref_tech and not (job_tech & pref_tech):
            return False

    content = " ".join([
        job.posting_title or "",
        job.company_name or "",
        job.job_description or "",
    ]).lower()

    if prefs.keywords_to_match:
        if not any(term.lower() in content for term in prefs.keywords_to_match if term):
            return False

    if prefs.keywords_to_exclude:
        if any(term.lower() in content for term in prefs.keywords_to_exclude if term):
            return False

    if prefs.visa_sponsorship_only:
        if "visa sponsorship" not in content:
            return False
        if any(term in content for term in ["visa sponsorship: no", "visa sponsorship: none", "visa sponsorship: unavailable"]):
            return False

    return True


def format_notification_email(jobs: List[JobPosting]) -> str:
    lines = ["New roles matching your preferences:", ""]
    for job in jobs:
        lines.append(f"- {job.posting_title or 'Role'} @ {job.company_name or 'Unknown'}")
        if job.job_location:
            lines.append(f"  Location: {job.job_location}")
        if job.application_url:
            lines.append(f"  Apply: {job.application_url}")
        lines.append("")
    return "\n".join(lines).strip()


def _send_email_sync(recipient: str, jobs: List[JobPosting]) -> None:
    config = fetch_environment_config()
    if not config.SMTP_HOST or not config.SMTP_FROM_EMAIL:
        logger.error("SMTP settings are not configured, cannot send email to %s", recipient)
        raise RuntimeError("SMTP settings are not configured.")

    logger.info("Sending notification email to %s with %d job(s)", recipient, len(jobs))

    message = EmailMessage()
    message["Subject"] = f"HN Job Board: {len(jobs)} new matches"
    message["From"] = config.SMTP_FROM_EMAIL
    message["To"] = recipient
    message.set_content(format_notification_email(jobs))

    with smtplib.SMTP(config.SMTP_HOST, config.SMTP_PORT) as smtp:
        if config.SMTP_USE_TLS:
            smtp.starttls()
        if config.SMTP_USERNAME and config.SMTP_PASSWORD:
            smtp.login(config.SMTP_USERNAME, config.SMTP_PASSWORD)
        smtp.send_message(message)

    logger.info("Notification email sent successfully to %s", recipient)


async def send_notification_email(recipient: str, jobs: List[JobPosting]) -> None:
    try:
        await asyncio.to_thread(_send_email_sync, recipient, jobs)
    except Exception:
        logger.error("Failed to send notification email to %s", recipient, exc_info=True)
        raise


def _send_confirmation_sync(recipient: str, jobs: List[JobPosting]) -> None:
    config = fetch_environment_config()
    if not config.SMTP_HOST or not config.SMTP_FROM_EMAIL:
        logger.error("SMTP settings are not configured, cannot send confirmation to %s", recipient)
        raise RuntimeError("SMTP settings are not configured.")

    logger.info("Sending confirmation email to %s with %d match(es)", recipient, len(jobs))

    message = EmailMessage()
    message["From"] = config.SMTP_FROM_EMAIL
    message["To"] = recipient

    if jobs:
        message["Subject"] = f"Notifications enabled — {len(jobs)} matches found"
        body = (
            "You've enabled job notifications on Who Is Hiring.\n"
            "You'll receive daily emails when new jobs match your preferences.\n\n"
            + format_notification_email(jobs)
        )
    else:
        message["Subject"] = "Notifications enabled — Who Is Hiring"
        body = (
            "You've enabled job notifications on Who Is Hiring.\n\n"
            "You'll receive daily emails when new jobs match your preferences.\n"
            "We'll notify you as soon as matching roles are posted."
        )

    message.set_content(body)

    with smtplib.SMTP(config.SMTP_HOST, config.SMTP_PORT) as smtp:
        if config.SMTP_USE_TLS:
            smtp.starttls()
        if config.SMTP_USERNAME and config.SMTP_PASSWORD:
            smtp.login(config.SMTP_USERNAME, config.SMTP_PASSWORD)
        smtp.send_message(message)

    logger.info("Confirmation email sent successfully to %s", recipient)


async def send_confirmation_email(recipient: str, jobs: List[JobPosting]) -> None:
    try:
        await asyncio.to_thread(_send_confirmation_sync, recipient, jobs)
    except Exception:
        logger.error("Failed to send confirmation email to %s", recipient, exc_info=True)
        raise


def _send_reset_email_sync(recipient: str, reset_url: str) -> None:
    config = fetch_environment_config()
    if not config.SMTP_HOST or not config.SMTP_FROM_EMAIL:
        logger.error("SMTP settings are not configured, cannot send reset email to %s", recipient)
        raise RuntimeError("SMTP settings are not configured.")

    logger.info("Sending password reset email to %s", recipient)

    message = EmailMessage()
    message["Subject"] = "Password Reset — Who Is Hiring"
    message["From"] = config.SMTP_FROM_EMAIL
    message["To"] = recipient
    message.set_content(
        "You requested a password reset for your Who Is Hiring account.\n\n"
        f"Click the link below to set a new password:\n{reset_url}\n\n"
        "This link expires in 30 minutes.\n\n"
        "If you didn't request this, you can safely ignore this email."
    )

    with smtplib.SMTP(config.SMTP_HOST, config.SMTP_PORT) as smtp:
        if config.SMTP_USE_TLS:
            smtp.starttls()
        if config.SMTP_USERNAME and config.SMTP_PASSWORD:
            smtp.login(config.SMTP_USERNAME, config.SMTP_PASSWORD)
        smtp.send_message(message)

    logger.info("Password reset email sent successfully to %s", recipient)


async def send_reset_email(recipient: str, reset_url: str) -> None:
    try:
        await asyncio.to_thread(_send_reset_email_sync, recipient, reset_url)
    except Exception:
        logger.error("Failed to send password reset email to %s", recipient, exc_info=True)
        raise


def _send_feedback_email_sync(sender_email: str, subject: str, message_body: str) -> None:
    config = fetch_environment_config()
    if not config.SMTP_HOST or not config.SMTP_FROM_EMAIL:
        logger.error("SMTP settings are not configured, cannot send feedback email")
        raise RuntimeError("SMTP settings are not configured.")

    logger.info("Sending feedback email from %s", sender_email)

    message = EmailMessage()
    message["Subject"] = f"Feedback: {subject}"
    message["From"] = config.SMTP_FROM_EMAIL
    message["To"] = "feedback-hn@abbyweinreb.com"
    message.set_content(
        f"Feedback from: {sender_email}\n\n"
        f"Subject: {subject}\n\n"
        f"{message_body}"
    )

    with smtplib.SMTP(config.SMTP_HOST, config.SMTP_PORT) as smtp:
        if config.SMTP_USE_TLS:
            smtp.starttls()
        if config.SMTP_USERNAME and config.SMTP_PASSWORD:
            smtp.login(config.SMTP_USERNAME, config.SMTP_PASSWORD)
        smtp.send_message(message)

    logger.info("Feedback email sent successfully from %s", sender_email)


async def send_feedback_email(sender_email: str, subject: str, message_body: str) -> None:
    try:
        await asyncio.to_thread(_send_feedback_email_sync, sender_email, subject, message_body)
    except Exception:
        logger.error("Failed to send feedback email from %s", sender_email, exc_info=True)
        raise