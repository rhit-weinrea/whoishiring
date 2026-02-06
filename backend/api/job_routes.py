from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_
from typing import List, Optional
from backend.core.database_engine import acquire_db_session
from backend.data_models.schemas import JobData
from backend.data_models.models import UserAccount, JobPosting
from backend.utilities.authentication import extract_current_user
from backend.utilities.location import normalize_location

job_api = APIRouter(prefix="/jobs", tags=["Job Postings"])


@job_api.get("/browse", response_model=List[JobData])
async def browse_postings(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    remote_filter: Optional[str] = Query(None),
    location_query: Optional[str] = Query(None),
    tech_filter: Optional[str] = Query(None),
    company_search: Optional[str] = Query(None),
    session: AsyncSession = Depends(acquire_db_session),
    account: UserAccount = Depends(extract_current_user)
):
    stmt = select(JobPosting)
    
    filters = []
    
    if remote_filter:
        filters.append(JobPosting.remote_status == remote_filter.lower())
    
    if location_query:
        normalized = normalize_location(location_query)
        normalized_value = normalized.normalized if normalized else location_query
        filters.append(JobPosting.job_location.ilike(f"%{normalized_value}%"))
    
    if tech_filter:
        filters.append(JobPosting.tech_stack.any(tech_filter.lower()))
    
    if company_search:
        filters.append(JobPosting.company_name.ilike(f"%{company_search}%"))
    
    if filters:
        stmt = stmt.where(and_(*filters))
    
    stmt = stmt.order_by(JobPosting.parsed_timestamp.desc()).offset(skip).limit(limit)
    
    result = await session.execute(stmt)
    jobs = result.scalars().all()
    
    return jobs


@job_api.get("/{job_id}", response_model=JobData)
async def fetch_job_details(
    job_id: int,
    session: AsyncSession = Depends(acquire_db_session),
    account: UserAccount = Depends(extract_current_user)
):
    stmt = select(JobPosting).where(JobPosting.job_id == job_id)
    result = await session.execute(stmt)
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    return job


@job_api.get("/search/text", response_model=List[JobData])
async def search_text(
    search_term: str = Query(..., min_length=2),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    session: AsyncSession = Depends(acquire_db_session),
    account: UserAccount = Depends(extract_current_user)
):
    pattern = f"%{search_term}%"
    
    stmt = select(JobPosting).where(
        or_(
            JobPosting.posting_title.ilike(pattern),
            JobPosting.company_name.ilike(pattern),
            JobPosting.job_description.ilike(pattern)
        )
    ).order_by(JobPosting.parsed_timestamp.desc()).offset(skip).limit(limit)
    
    result = await session.execute(stmt)
    jobs = result.scalars().all()
    
    return jobs
