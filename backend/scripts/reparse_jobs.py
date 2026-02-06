import argparse
import asyncio
from datetime import datetime, timezone

from sqlalchemy import select
import httpx

from backend.core.database_engine import SessionFactory
from backend.data_models.models import JobPosting
from backend.scrapers.deepseek_parser import AIJobParser
from backend.utilities.location import normalize_location
from backend.utilities.text_parser import extract_application_url


def build_summary(parsed: dict, raw: str) -> tuple[str | None, str | None, str | None, str]:
    role_titles = []
    for role in parsed.get("roles", []) or []:
        if isinstance(role, dict):
            title = role.get("title")
            if title:
                role_titles.append(title)

    posting_title = parsed.get("title") or (role_titles[0] if role_titles else None)
    workplace_type = parsed.get("workplace_type") or parsed.get("remote_status")
    apply_url = parsed.get("apply_url") or parsed.get("url")
    if not apply_url or "..." in apply_url or "…" in apply_url:
        apply_url = extract_application_url(raw)
    apply_contact = parsed.get("apply_contact")
    visa = parsed.get("visa_sponsorship")
    summary = parsed.get("summary") or parsed.get("description") or ""

    if visa and visa != "unknown":
        summary = f"{summary}\nVisa sponsorship: {visa}".strip()

    if apply_contact and apply_contact != apply_url:
        summary = f"{summary}\nApply: {apply_contact}".strip()
    if apply_url:
        summary = f"{summary}\nApply URL: {apply_url}".strip()

    return posting_title, workplace_type, apply_url, summary


async def main(limit: int) -> None:
    parser = AIJobParser()
    async with SessionFactory() as session:
        result = await session.execute(
            select(JobPosting).order_by(JobPosting.job_id.asc()).limit(limit)
        )
        jobs = result.scalars().all()
        updated = 0

        async with httpx.AsyncClient(timeout=15.0) as client:
            for job in jobs:
                raw = job.raw_content or job.job_description or ""
                parsed = await parser.parse_job_content(raw)
                if parsed.get("is_posting") is False:
                    continue

                normalized = normalize_location(parsed.get("location"))
                job.job_location = normalized.normalized if normalized else parsed.get("location")

                posting_title, workplace_type, apply_url, summary = build_summary(parsed, raw)

                if posting_title:
                    job.posting_title = posting_title
                job.company_name = parsed.get("company")
                job.remote_status = workplace_type
                job.tech_stack = parsed.get("technologies", [])
                job.job_description = summary
                job.salary_range = parsed.get("salary")
                if apply_url:
                    job.application_url = apply_url

                if job.hn_item_id:
                    resp = await client.get(f"https://hacker-news.firebaseio.com/v0/item/{job.hn_item_id}.json")
                    if resp.status_code == 200:
                        data = resp.json()
                        hn_time = data.get("time")
                        if isinstance(hn_time, (int, float)):
                            job.parsed_timestamp = datetime.fromtimestamp(hn_time, tz=timezone.utc)

                updated += 1

        await session.commit()
        print(f"Reparsed {updated} jobs.")


if __name__ == "__main__":
    arg_parser = argparse.ArgumentParser()
    arg_parser.add_argument("--limit", type=int, default=5)
    args = arg_parser.parse_args()
    asyncio.run(main(args.limit))
