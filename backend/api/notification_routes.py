from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.configuration import fetch_environment_config
from backend.core.database_engine import acquire_db_session
from backend.data_models.models import UserAccount, UserJobPreferences, JobPosting
from backend.utilities.notifications import job_matches_preferences, send_notification_email

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
            send_notification_email(account.email_address, jobs)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Notification error: {exc}"
            )

        prefs.last_notified_timestamp = datetime.now(timezone.utc)
        notified_users += 1
        total_jobs_sent += len(jobs)

    await session.commit()

    return {
        "status": "success",
        "notified_users": notified_users,
        "jobs_sent": total_jobs_sent
    }