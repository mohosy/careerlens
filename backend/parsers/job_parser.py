import os
import json

import httpx
from bs4 import BeautifulSoup
from openai import AsyncOpenAI

from models.schemas import JobData

def _get_client():
    return AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


async def fetch_page(url: str) -> str:
    """Fetch a web page and extract its text content."""
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        )
    }
    async with httpx.AsyncClient(follow_redirects=True, timeout=30) as client_http:
        response = await client_http.get(url, headers=headers)
        response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    # Remove script/style elements
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()

    return soup.get_text(separator="\n", strip=True)


async def parse_job_listing(url: str) -> JobData:
    """Scrape a job listing URL and parse it into structured data."""
    page_text = await fetch_page(url)

    # Truncate if too long (keep first ~6000 chars for the LLM)
    if len(page_text) > 6000:
        page_text = page_text[:6000]

    response = await _get_client().chat.completions.create(
        model="gpt-4o",
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a job listing parser. Extract structured data from the job posting text. "
                    "Return a JSON object with these fields:\n"
                    "- company: string (company name)\n"
                    "- role: string (job title)\n"
                    "- location: string (city, state or 'Remote')\n"
                    "- description: string (brief job description)\n"
                    "- requirements: string[] (required qualifications)\n"
                    "- nice_to_haves: string[] (preferred/optional qualifications)\n"
                    "- salary_range: string or null\n"
                    "If a field is not found, use reasonable defaults. Never leave company or role empty."
                ),
            },
            {
                "role": "user",
                "content": f"Parse this job listing from {url}:\n\n{page_text}",
            },
        ],
    )

    parsed = json.loads(response.choices[0].message.content)
    parsed["url"] = url
    return JobData(**parsed)
