from __future__ import annotations

from dataclasses import dataclass
from email.message import EmailMessage
import smtplib
from typing import Iterable, List

from backend.core.configuration import fetch_environment_config
from backend.data_models.models import JobPosting, UserJobPreferences


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


def send_notification_email(recipient: str, jobs: List[JobPosting]) -> None:
    config = fetch_environment_config()
    if not config.SMTP_HOST or not config.SMTP_FROM_EMAIL:
        raise RuntimeError("SMTP settings are not configured.")

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