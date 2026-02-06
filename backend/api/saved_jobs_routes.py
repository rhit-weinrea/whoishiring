from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from backend.core.database_engine import acquire_db_session
from backend.data_models.schemas import (
    BookmarkJobPayload,
    ModifyBookmarkPayload,
    BookmarkedJobData
)
from backend.data_models.models import UserAccount, SavedJob, JobPosting
from backend.utilities.authentication import extract_current_user

bookmark_api = APIRouter(prefix="/saved-jobs", tags=["Saved Jobs"])


@bookmark_api.post("/save", response_model=BookmarkedJobData, status_code=status.HTTP_201_CREATED)
async def bookmark_job(
    payload: BookmarkJobPayload,
    session: AsyncSession = Depends(acquire_db_session),
    account: UserAccount = Depends(extract_current_user)
):
    job_stmt = select(JobPosting).where(JobPosting.job_id == payload.job_posting_id)
    job_result = await session.execute(job_stmt)
    job = job_result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    existing_stmt = select(SavedJob).where(
        SavedJob.user_account_id == account.user_id,
        SavedJob.job_posting_id == payload.job_posting_id
    )
    existing_result = await session.execute(existing_stmt)
    
    if existing_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job already bookmarked"
        )
    
    bookmark = SavedJob(
        user_account_id=account.user_id,
        job_posting_id=payload.job_posting_id,
        notes=payload.notes,
        applied_status=False
    )
    
    session.add(bookmark)
    await session.commit()
    await session.refresh(bookmark)
    
    result = await session.execute(
        select(SavedJob).where(SavedJob.saved_id == bookmark.saved_id)
    )
    return result.scalar_one()


@bookmark_api.get("/my-saved-jobs", response_model=List[BookmarkedJobData])
async def list_bookmarks(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    applied_only: bool = Query(False),
    session: AsyncSession = Depends(acquire_db_session),
    account: UserAccount = Depends(extract_current_user)
):
    stmt = select(SavedJob).where(SavedJob.user_account_id == account.user_id)
    
    if applied_only:
        stmt = stmt.where(SavedJob.applied_status == True)
    
    stmt = stmt.order_by(SavedJob.saved_timestamp.desc()).offset(skip).limit(limit)
    
    result = await session.execute(stmt)
    bookmarks = result.scalars().all()
    
    return bookmarks


@bookmark_api.patch("/{saved_id}", response_model=BookmarkedJobData)
async def update_bookmark(
    saved_id: int,
    payload: ModifyBookmarkPayload,
    session: AsyncSession = Depends(acquire_db_session),
    account: UserAccount = Depends(extract_current_user)
):
    stmt = select(SavedJob).where(
        SavedJob.saved_id == saved_id,
        SavedJob.user_account_id == account.user_id
    )
    result = await session.execute(stmt)
    bookmark = result.scalar_one_or_none()
    
    if not bookmark:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bookmark not found"
        )
    
    if payload.notes is not None:
        bookmark.notes = payload.notes
    
    if payload.applied_status is not None:
        bookmark.applied_status = payload.applied_status
    
    await session.commit()
    await session.refresh(bookmark)
    
    return bookmark


@bookmark_api.delete("/{saved_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bookmark(
    saved_id: int,
    session: AsyncSession = Depends(acquire_db_session),
    account: UserAccount = Depends(extract_current_user)
):
    stmt = select(SavedJob).where(
        SavedJob.saved_id == saved_id,
        SavedJob.user_account_id == account.user_id
    )
    result = await session.execute(stmt)
    bookmark = result.scalar_one_or_none()
    
    if not bookmark:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bookmark not found"
        )
    
    await session.delete(bookmark)
    await session.commit()
    
    return None
