import httpx
from typing import Optional, Dict
import json
from backend.core.configuration import fetch_environment_config
from backend.utilities.text_parser import parse_with_regex

config = fetch_environment_config()


class AIJobParser:
    def __init__(self):
        self.api_key = config.DEEPSEEK_API_KEY
        self.endpoint = config.DEEPSEEK_API_URL
        self.model_name = config.DEEPSEEK_MODEL
    
    async def parse_using_ai(self, raw_text: str) -> Optional[Dict]:
        system_instruction = """You are parsing Hacker News job postings. Return JSON only, no markdown.
    Normalize names and titles for clarity (e.g., "developery-data person" -> "Developer/Analyst").
    Use Title Case for role titles and company names. Expand abbreviations when clear, Keep summary as a concise, neutral summary of the role/company; avoid repeating the role title, skills, location, visa information,company name, raw URLs,email addresses, etc..
    If multiple roles are listed, include each role as a separate entry in roles.
{
    "is_posting": true/false,
    "company": "company name or null",
    "roles": [
        {
            "title": "role title",
            "seniority": "intern/junior/mid/senior/lead/staff/principal/unknown",
            "employment_type": "full-time/part-time/contract/intern/unknown"
        }
    ],
    "location": "city, region, country or Remote or null",
    "workplace_type": "remote/hybrid/onsite/unknown",
    "visa_sponsorship": "yes/no/unknown",
    "posted_at": "ISO date string if present in text else null",
    "apply_url": "application URL or null",
    "apply_contact": "email or instructions or null",
    "technologies": ["tech", "stack"],
    "salary": "salary range or null",
    "summary": "brief summary (max 500 chars)"
}

Rules:
- Set is_posting=false if the text is a reply/comment, discussion, or non-job content.
- If multiple roles are present, include each in roles; otherwise a single role is fine.
- If no clear role title, leave roles empty.
- Keep summary as a concise, neutral summary of the role/company; avoid repeating the role title, skills, location, visa information,company name, raw URLs,email addresses.
"""
        
        user_content = f"Parse this posting:\n\n{raw_text[:2000]}"
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    self.endpoint,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model_name,
                        "messages": [
                            {"role": "system", "content": system_instruction},
                            {"role": "user", "content": user_content}
                        ],
                        "temperature": 0.3,
                        "max_tokens": 1000
                    }
                )
                
                if resp.status_code == 200:
                    data = resp.json()
                    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    
                    content = content.strip()
                    if content.startswith("```json"):
                        content = content[7:]
                    if content.startswith("```"):
                        content = content[3:]
                    if content.endswith("```"):
                        content = content[:-3]
                    content = content.strip()
                    
                    return json.loads(content)
        except Exception as e:
            print(f"AI parsing error: {e}")
        
        return None
    
    async def parse_job_content(self, raw_text: str) -> Dict:
        ai_result = await self.parse_using_ai(raw_text)
        if ai_result:
            return ai_result
        
        print("Falling back to regex parser")
        return parse_with_regex(raw_text)
