import logging
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.core.database_engine import acquire_db_session, SessionFactory
from backend.data_models.schemas import PreferencesPayload, PreferencesData
from backend.data_models.models import UserAccount, UserJobPreferences, JobPosting
from backend.utilities.authentication import extract_current_user
from backend.utilities.location import normalize_location
from backend.utilities.notifications import job_matches_preferences, send_notification_email

logger = logging.getLogger(__name__)

pref_api = APIRouter(prefix="/preferences", tags=["User Preferences"])


async def send_welcome_notification(user_id: int, email: str):
    """Send immediate notification with recent matching jobs for new users."""
    session = SessionFactory()
    try:
        prefs_stmt = select(UserJobPreferences).where(
            UserJobPreferences.user_account_id == user_id
        )
        prefs = (await session.execute(prefs_stmt)).scalar_one_or_none()
        if not prefs or not prefs.notification_enabled:
            return

        since = datetime.now(timezone.utc) - timedelta(days=7)
        job_stmt = select(JobPosting).where(
            JobPosting.parsed_timestamp >= since
        ).order_by(JobPosting.parsed_timestamp.desc())
        jobs = [
            j for j in (await session.execute(job_stmt)).scalars().all()
            if job_matches_preferences(j, prefs)
        ]

        if jobs:
            send_notification_email(email, jobs)
            logger.info(f"Sent welcome notification to {email} with {len(jobs)} jobs")
        else:
            logger.info(f"No matching jobs for welcome notification to {email}")

        prefs.last_notified_timestamp = datetime.now(timezone.utc)
        await session.commit()
    except Exception as e:
        await session.rollback()
        logger.error(f"Welcome notification failed for {email}: {e}")
    finally:
        await session.close()


@pref_api.get("/my-preferences", response_model=PreferencesData)
async def fetch_preferences(
    session: AsyncSession = Depends(acquire_db_session),
    account: UserAccount = Depends(extract_current_user)
):
    stmt = select(UserJobPreferences).where(
        UserJobPreferences.user_account_id == account.user_id
    )
    result = await session.execute(stmt)
    prefs = result.scalar_one_or_none()

    if not prefs:
        prefs = UserJobPreferences(
            user_account_id=account.user_id,
            remote_only=False,
            notification_enabled=True
        )
        session.add(prefs)
        await session.commit()
        await session.refresh(prefs)

    return prefs


@pref_api.put("/my-preferences", response_model=PreferencesData)
async def modify_preferences(
    payload: PreferencesPayload,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(acquire_db_session),
    account: UserAccount = Depends(extract_current_user)
):
    stmt = select(UserJobPreferences).where(
        UserJobPreferences.user_account_id == account.user_id
    )
    result = await session.execute(stmt)
    prefs = result.scalar_one_or_none()

    is_first_save = prefs is None or prefs.last_notified_timestamp is None

    if not prefs:
        prefs = UserJobPreferences(user_account_id=account.user_id)
        session.add(prefs)

    normalized_locations = []
    if payload.preferred_locations:
        for location in payload.preferred_locations:
            if not location:
                continue
            normalized = normalize_location(location)
            normalized_locations.append(normalized.normalized if normalized else location)

    prefs.preferred_locations = normalized_locations or None
    prefs.preferred_tech_stack = payload.preferred_tech_stack
    prefs.remote_only = payload.remote_only
    prefs.visa_sponsorship_only = payload.visa_sponsorship_only
    prefs.min_salary = payload.min_salary
    prefs.max_salary = payload.max_salary
    prefs.keywords_to_match = payload.keywords_to_match
    prefs.keywords_to_exclude = payload.keywords_to_exclude
    prefs.notification_enabled = payload.notification_enabled

    await session.commit()
    await session.refresh(prefs)

    # Send immediate welcome notification for first-time preference setup
    if is_first_save and payload.notification_enabled:
        background_tasks.add_task(
            send_welcome_notification,
            account.user_id,
            account.email_address,
        )

    return prefs


@pref_api.delete("/my-preferences", status_code=status.HTTP_204_NO_CONTENT)
async def clear_preferences(
    session: AsyncSession = Depends(acquire_db_session),
    account: UserAccount = Depends(extract_current_user)
):
    stmt = select(UserJobPreferences).where(
        UserJobPreferences.user_account_id == account.user_id
    )
    result = await session.execute(stmt)
    prefs = result.scalar_one_or_none()

    if prefs:
        await session.delete(prefs)
        await session.commit()

    return None
