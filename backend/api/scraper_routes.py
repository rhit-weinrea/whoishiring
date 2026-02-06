from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.core.database_engine import acquire_db_session
from backend.core.configuration import fetch_environment_config
from backend.data_models.schemas import ScraperPayload, ScraperResultData
from backend.scrapers.job_scraper import JobScrapeOrchestrator

config = fetch_environment_config()
scraper_api = APIRouter(prefix="/admin", tags=["Admin - Scraper"])


@scraper_api.post("/trigger-scrape", response_model=ScraperResultData)
async def initiate_scraping(
    payload: ScraperPayload,
    session: AsyncSession = Depends(acquire_db_session)
):
    if payload.admin_api_key != config.ADMIN_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid admin key"
        )
    
    orchestrator = JobScrapeOrchestrator()
    
    try:
        outcome = await orchestrator.execute_scraping(
            session,
            force=payload.force_refresh,
            parse=payload.parse,
            who_is_hiring_id=payload.who_is_hiring_id,
            max_items=payload.max_items
        )
        
        return ScraperResultData(
            status=outcome["status"],
            message=outcome["message"],
            jobs_scraped=outcome["jobs_scraped"],
            thread_id=outcome.get("thread_id")
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Scraping error: {str(e)}"
        )
