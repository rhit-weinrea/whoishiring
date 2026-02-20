import logging
# from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.core.database_engine import acquire_db_session
from backend.data_models.schemas import PreferencesPayload, PreferencesData
from backend.data_models.models import UserAccount, UserJobPreferences  # , JobPosting
from backend.utilities.authentication import extract_current_user
from backend.utilities.location import normalize_location
# from backend.utilities.notifications import job_matches_preferences, send_confirmation_email

logger = logging.getLogger(__name__)

pref_api = APIRouter(prefix="/preferences", tags=["User Preferences"])


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
            notification_enabled=False
        )
        session.add(prefs)
        await session.commit()
        await session.refresh(prefs)

    return prefs


@pref_api.put("/my-preferences")
async def modify_preferences(
    payload: PreferencesPayload,
    session: AsyncSession = Depends(acquire_db_session),
    account: UserAccount = Depends(extract_current_user)
):
    stmt = select(UserJobPreferences).where(
        UserJobPreferences.user_account_id == account.user_id
    )
    result = await session.execute(stmt)
    prefs = result.scalar_one_or_none()

    if not prefs:
        prefs = UserJobPreferences(user_account_id=account.user_id)
        session.add(prefs)

    was_enabled = prefs.notification_enabled
    now_enabled = payload.notification_enabled

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

    # email_status = None
    # should_confirm = now_enabled and not was_enabled
    # if should_confirm:
    #     try:
    #         since = datetime.now(timezone.utc) - timedelta(days=1)
    #         job_stmt = select(JobPosting).where(
    #             JobPosting.parsed_timestamp >= since
    #         ).order_by(JobPosting.parsed_timestamp.desc())
    #         jobs_result = await session.execute(job_stmt)
    #         matched = [j for j in jobs_result.scalars().all() if job_matches_preferences(j, prefs)]
    #         await send_confirmation_email(account.email_address, matched)
    #         logger.info("Sent confirmation email to %s with %d match(es)", account.email_address, len(matched))
    #         email_status = "sent"
    #     except Exception as exc:
    #         logger.error("Failed to send confirmation email to %s: %s", account.email_address, exc, exc_info=True)
    #         email_status = f"failed: {exc}"

    prefs_data = PreferencesData.model_validate(prefs)
    response = prefs_data.model_dump(mode="json")
    # if email_status is not None:
    #     response["email_status"] = email_status
    return response


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
