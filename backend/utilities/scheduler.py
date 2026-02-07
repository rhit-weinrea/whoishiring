import logging
import sys
from datetime import datetime, timezone, timedelta

logging.basicConfig(level=logging.INFO, stream=sys.stdout)

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy import select

from backend.core.database_engine import SessionFactory
from backend.core.configuration import fetch_environment_config
from backend.scrapers.job_scraper import JobScrapeOrchestrator
from backend.scrapers.hn_api_client import HNAPIConnector
from backend.utilities.notifications import job_matches_preferences, send_notification_email
from backend.data_models.models import UserAccount, UserJobPreferences, JobPosting

logger = logging.getLogger(__name__)
config = fetch_environment_config()

scheduler = AsyncIOScheduler()


async def run_scheduled_scrape():
    """Scrape new job postings. Only fetches comments not already in the DB."""
    logger.info("Scheduled scrape starting...")
    try:
        connector = HNAPIConnector()
        thread_id = await connector.locate_hiring_thread()
        if not thread_id:
            logger.warning("Could not locate Who Is Hiring thread")
            return

        logger.info(f"Found Who Is Hiring thread: {thread_id}")

        session = SessionFactory()
        try:
            # Get IDs we already have for this thread
            known_stmt = select(JobPosting.hn_item_id).where(
                JobPosting.source_thread_id == str(thread_id)
            )
            known_result = await session.execute(known_stmt)
            known_ids = {row[0] for row in known_result.all()}
            logger.info(f"Already have {len(known_ids)} posts from thread {thread_id}")

            # Fetch only new comments
            new_comments = await connector.fetch_new_comments(str(thread_id), known_ids)
            if not new_comments:
                logger.info("No new comments found, skipping parse")
                return

            logger.info(f"Found {len(new_comments)} new comments to process")

            # Process through the orchestrator
            orchestrator = JobScrapeOrchestrator()
            result = await orchestrator.execute_scraping(
                session,
                force=False,
                parse=True,
                who_is_hiring_id=str(thread_id),
            )
            await session.commit()
            logger.info(f"Scheduled scrape complete: {result['message']}")
        except Exception as e:
            await session.rollback()
            raise
        finally:
            await session.close()
    except Exception as e:
        logger.error(f"Scheduled scrape error: {e}", exc_info=True)


async def run_scheduled_notifications():
    """Send daily notification emails to users with matching preferences."""
    logger.info("Scheduled notifications starting...")
    session = SessionFactory()
    try:
        stmt = select(UserJobPreferences, UserAccount).join(
            UserAccount, UserAccount.user_id == UserJobPreferences.user_account_id
        ).where(UserJobPreferences.notification_enabled.is_(True))
        result = await session.execute(stmt)
        rows = result.all()

        notified = 0
        for prefs, account in rows:
            since = prefs.last_notified_timestamp or (datetime.now(timezone.utc) - timedelta(days=1))
            job_stmt = select(JobPosting).where(
                JobPosting.parsed_timestamp >= since
            ).order_by(JobPosting.parsed_timestamp.desc())
            jobs_result = await session.execute(job_stmt)
            jobs = [j for j in jobs_result.scalars().all() if job_matches_preferences(j, prefs)]

            if jobs:
                try:
                    send_notification_email(account.email_address, jobs)
                    notified += 1
                except Exception as e:
                    logger.error(f"Failed to email {account.email_address}: {e}")
                    continue

            prefs.last_notified_timestamp = datetime.now(timezone.utc)

        await session.commit()
        logger.info(f"Scheduled notifications complete: {notified} users notified")
    except Exception as e:
        await session.rollback()
        logger.error(f"Scheduled notifications error: {e}", exc_info=True)
    finally:
        await session.close()


def start_scheduler():
    """Start the background scheduler with scraping and notification jobs."""
    scheduler.add_job(
        run_scheduled_scrape,
        IntervalTrigger(minutes=30),
        id="scrape_job",
        replace_existing=True,
        max_instances=1,
    )

    scheduler.add_job(
        run_scheduled_notifications,
        CronTrigger(hour=15, minute=0, timezone="America/New_York"),
        id="notification_job",
        replace_existing=True,
        max_instances=1,
    )

    scheduler.start()
    print("Scheduler started: scraping every 30m, notifications daily at 3pm ET", flush=True)


def stop_scheduler():
    """Shutdown the scheduler gracefully."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped")
