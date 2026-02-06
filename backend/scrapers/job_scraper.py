from typing import Dict, List
from datetime import datetime, timezone
import re
import html
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.scrapers.hn_api_client import HNAPIConnector
from backend.scrapers.deepseek_parser import AIJobParser
from backend.data_models.models import JobPosting
from backend.utilities.location import normalize_location
from backend.utilities.text_parser import extract_application_url

# Batch commit size for database operations
BATCH_COMMIT_SIZE = 10


class JobScrapeOrchestrator:
    def __init__(self):
        self.hn_connector = HNAPIConnector()
        self.ai_parser = AIJobParser()
    
    def sanitize_html(self, html_content: str) -> str:
        text = html.unescape(html_content)
        text = re.sub(r'<p>', '\n', text)
        text = re.sub(r'<[^>]+>', '', text)
        return text.strip()

    def is_probable_job_post(self, text: str) -> bool:
        lower = text.lower()
        if len(lower) < 80:
            return False
        has_pipe = "|" in lower
        has_url = "http://" in lower or "https://" in lower
        has_email = "@" in lower
        return has_pipe or has_url or has_email
    
    async def execute_scraping(self, session: AsyncSession, force: bool = False, parse: bool = True, who_is_hiring_id: str | None = None, max_items: int | None = None) -> Dict:
        print("Retrieving HN job stories...")
        items: List[Dict] = await self.hn_connector.fetch_job_stories()
        print(f"Retrieved {len(items)} job stories")

        thread_kids: set[int] = set()

        if who_is_hiring_id:
            print(f"Retrieving Who Is Hiring thread {who_is_hiring_id}...")
            thread = await self.hn_connector.fetch_thread_by_id(who_is_hiring_id)
            if thread:
                thread_kids = set(thread.get("kids", []) or [])
                comments = await self.hn_connector.fetch_all_comments(who_is_hiring_id)
                print(f"Retrieved {len(comments)} top-level comments")
                items.extend(comments)
            else:
                print("Provided thread id is not a Who Is Hiring story; skipping.")

        target_count = max_items
        
        saved_count = 0
        
        source_thread_id = "jobstories"

        for comment in items:
            try:
                if target_count is not None and saved_count >= target_count:
                    break
                is_job_story = comment.get("type") == "job" and comment.get("parent") is None
                is_who_comment = (
                    comment.get("type") == "comment"
                    and str(comment.get("parent")) == str(who_is_hiring_id)
                    and (comment.get("id") in thread_kids)
                )
                if not (is_job_story or is_who_comment):
                    continue
                if comment.get("deleted") or comment.get("dead"):
                    continue
                if not comment.get("by"):
                    continue
                cleaned_text = self.sanitize_html(comment.get("text", ""))
                posted_time = comment.get("time")
                parsed_timestamp = None
                if isinstance(posted_time, (int, float)):
                    parsed_timestamp = datetime.fromtimestamp(posted_time, tz=timezone.utc)
                
                if len(cleaned_text) < 50:
                    continue
                if is_who_comment and not self.is_probable_job_post(cleaned_text):
                    continue
                
                comment_id = str(comment.get("id"))
                
                existing_stmt = select(JobPosting).where(JobPosting.hn_item_id == comment_id)
                existing_result = await session.execute(existing_stmt)
                existing_job = existing_result.scalar_one_or_none()
                if existing_job and not force:
                    continue
                
                print(f"Processing job {comment_id}...")
                if parse:
                    parsed = await self.ai_parser.parse_job_content(cleaned_text)
                    if parsed.get("is_posting") is False:
                        continue
                    normalized_location = normalize_location(parsed.get("location"))
                    job_location = normalized_location.normalized if normalized_location else parsed.get("location")
                    role_titles = []
                    for role in parsed.get("roles", []) or []:
                        title = role.get("title") if isinstance(role, dict) else None
                        if title:
                            role_titles.append(title)
                    posting_title = parsed.get("title") or (role_titles[0] if role_titles else None)
                    workplace_type = parsed.get("workplace_type") or parsed.get("remote_status")
                    apply_url = parsed.get("apply_url") or parsed.get("url")
                    if not apply_url or "..." in apply_url or "…" in apply_url:
                        apply_url = extract_application_url(cleaned_text)
                    apply_contact = parsed.get("apply_contact")
                    visa = parsed.get("visa_sponsorship")
                    summary = parsed.get("summary") or parsed.get("description") or ""
                    if visa and visa != "unknown":
                        summary = f"{summary}\nVisa sponsorship: {visa}".strip()
                    if apply_contact and apply_contact != apply_url:
                        summary = f"{summary}\nApply: {apply_contact}".strip()
                    if apply_url:
                        summary = f"{summary}\nApply URL: {apply_url}".strip()
                    if existing_job:
                        existing_job.posting_title = posting_title
                        existing_job.company_name = parsed.get("company")
                        existing_job.job_location = job_location
                        existing_job.remote_status = workplace_type
                        existing_job.tech_stack = parsed.get("technologies", [])
                        existing_job.job_description = summary
                        existing_job.salary_range = parsed.get("salary")
                        existing_job.application_url = apply_url
                        existing_job.source_thread_id = source_thread_id if is_job_story else str(who_is_hiring_id)
                        existing_job.raw_content = cleaned_text
                        if parsed_timestamp:
                            existing_job.parsed_timestamp = parsed_timestamp
                        job_record = None
                    else:
                        job_record = JobPosting(
                            hn_item_id=comment_id,
                            posting_title=posting_title,
                            company_name=parsed.get("company"),
                            job_location=job_location,
                            remote_status=workplace_type,
                            tech_stack=parsed.get("technologies", []),
                            job_description=summary,
                            salary_range=parsed.get("salary"),
                            application_url=apply_url,
                            source_thread_id=source_thread_id if is_job_story else str(who_is_hiring_id),
                            raw_content=cleaned_text,
                            parsed_timestamp=parsed_timestamp
                        )
                else:
                    title = self.sanitize_html(comment.get("title", "")) if comment.get("title") else None
                    if existing_job:
                        if title:
                            existing_job.posting_title = title
                        existing_job.job_description = cleaned_text
                        existing_job.application_url = comment.get("url")
                        existing_job.source_thread_id = source_thread_id if is_job_story else str(who_is_hiring_id)
                        existing_job.raw_content = cleaned_text
                        if parsed_timestamp:
                            existing_job.parsed_timestamp = parsed_timestamp
                        job_record = None
                    else:
                        job_record = JobPosting(
                            hn_item_id=comment_id,
                            posting_title=title,
                            job_description=cleaned_text,
                            application_url=comment.get("url"),
                            source_thread_id=source_thread_id if is_job_story else str(who_is_hiring_id),
                            raw_content=cleaned_text,
                            parsed_timestamp=parsed_timestamp
                        )
                
                if job_record:
                    session.add(job_record)
                    saved_count += 1

                if target_count is not None and saved_count >= target_count:
                    await session.commit()
                    print(f"Reached target of {target_count} jobs. Stopping.")
                    break
                
                if saved_count % BATCH_COMMIT_SIZE == 0:
                    await session.commit()
                    print(f"Saved {saved_count} jobs...")
            
            except Exception as e:
                print(f"Error processing item: {e}")
                continue
        
        await session.commit()
        
        return {
            "status": "success",
            "message": f"Scraped {saved_count} jobs successfully",
            "jobs_scraped": saved_count,
            "thread_id": source_thread_id
        }
