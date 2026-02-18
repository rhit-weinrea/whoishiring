import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.configuration import fetch_environment_config
from backend.core.database_engine import acquire_db_session
from backend.data_models.models import UserAccount, UserJobPreferences, JobPosting
from backend.utilities.notifications import job_matches_preferences, send_notification_email

logger = logging.getLogger(__name__)
config = fetch_environment_config()
notification_api = APIRouter(prefix="/admin", tags=["Admin - Notifications"])


@notification_api.post("/trigger-notifications")
async def trigger_notifications(
    payload: dict,
    session: AsyncSession = Depends(acquire_db_session)
):
    if payload.get("admin_api_key") != config.ADMIN_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid admin key"
        )

    stmt = select(UserJobPreferences, UserAccount).join(
        UserAccount, UserAccount.user_id == UserJobPreferences.user_account_id
    ).where(UserJobPreferences.notification_enabled.is_(True))
    result = await session.execute(stmt)
    rows = result.all()

    notified_users = 0
    total_jobs_sent = 0

    for prefs, account in rows:
        since = prefs.last_notified_timestamp or (datetime.now(timezone.utc) - timedelta(days=1))
        job_stmt = select(JobPosting).where(JobPosting.parsed_timestamp >= since).order_by(JobPosting.parsed_timestamp.desc())
        jobs_result = await session.execute(job_stmt)
        jobs = [job for job in jobs_result.scalars().all() if job_matches_preferences(job, prefs)]

        if not jobs:
            prefs.last_notified_timestamp = datetime.now(timezone.utc)
            continue

        try:
            await send_notification_email(account.email_address, jobs)
            prefs.last_notified_timestamp = datetime.now(timezone.utc)
            notified_users += 1
            total_jobs_sent += len(jobs)
        except Exception as exc:
            logger.error(f"Failed to email {account.email_address}: {exc}")

    await session.commit()

    return {
        "status": "success",
        "notified_users": notified_users,
        "jobs_sent": total_jobs_sent
    }


class SeedTestJobPayload(BaseModel):
    admin_api_key: str
    posting_title: str = "Test Engineer (Notification Check)"
    company_name: str = "TestCo"
    job_location: str = "Remote"
    remote_status: str = "Remote"
    tech_stack: Optional[List[str]] = None
    job_description: str = "This is a test posting to verify email notifications."
    salary_range: Optional[str] = None
    application_url: Optional[str] = None


@notification_api.post("/seed-test-job")
async def seed_test_job_and_notify(
    payload: SeedTestJobPayload,
    session: AsyncSession = Depends(acquire_db_session),
):
    if payload.admin_api_key != config.ADMIN_API_KEY:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid admin key")

    job = JobPosting(
        hn_item_id=f"test-{int(datetime.now(timezone.utc).timestamp())}",
        posting_title=payload.posting_title,
        company_name=payload.company_name,
        job_location=payload.job_location,
        remote_status=payload.remote_status,
        tech_stack=payload.tech_stack or [],
        job_description=payload.job_description,
        salary_range=payload.salary_range,
        application_url=payload.application_url,
        source_thread_id="test",
    )
    session.add(job)
    await session.flush()

    # Trigger notifications for users whose preferences match this job
    stmt = select(UserJobPreferences, UserAccount).join(
        UserAccount, UserAccount.user_id == UserJobPreferences.user_account_id
    ).where(UserJobPreferences.notification_enabled.is_(True))
    result = await session.execute(stmt)
    rows = result.all()

    notified = []
    failed = []
    for prefs, account in rows:
        if not job_matches_preferences(job, prefs):
            continue
        try:
            await send_notification_email(account.email_address, [job])
            prefs.last_notified_timestamp = datetime.now(timezone.utc)
            notified.append(account.email_address)
        except Exception as exc:
            failed.append({"email": account.email_address, "error": str(exc)})

    await session.commit()

    return {
        "status": "success",
        "job_id": job.job_id,
        "notified": notified,
        "failed": failed,
    }