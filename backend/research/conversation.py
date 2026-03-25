import os
import json
from typing import Optional

from openai import AsyncOpenAI

from models.schemas import ResumeData


def _get_client():
    return AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


SYSTEM_PROMPT = """You are CareerLens, a friendly AI career research assistant. You help users prepare for their dream jobs through deep research.

Your conversation flow:
1. Ask about their dream role/job. Be warm and curious.
2. When they describe a role, suggest specific companies, positions, salary ranges, and locations. Present these as concise options.
3. Help them narrow down to a specific company + role combination.
4. Ask for their resume — they can drop a PDF or paste the text. Say something like "Drop your resume here (PDF) or paste the text, and I'll take a look."
5. Once you have the resume, review it and ask 1-2 clarifying questions if needed (graduation date, specific skills, etc.)
6. Once you have everything, confirm: "Great, I have everything I need. Ready for me to do a deep dive on [Company] — [Role]? This will take a few minutes."

IMPORTANT RULES:
- Keep responses SHORT and conversational. 2-4 sentences max unless presenting options.
- When suggesting companies, format them cleanly with company name, role, and estimated salary.
- Don't be overly formal or corporate. Be like a helpful friend who knows careers.
- When the user confirms they're ready, respond with EXACTLY this JSON at the END of your message:
  {"action": "start_research", "company": "...", "role": "..."}
- Only include that JSON when you have BOTH a confirmed company+role AND the resume.
- Never hallucinate salary data — say "I'll find exact numbers during research" if unsure.

You are having a multi-turn conversation. Remember context from prior messages."""


async def chat(messages: list[dict], resume_text: Optional[str] = None) -> str:
    """Process a chat message in the career conversation flow."""
    system_messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    if resume_text:
        system_messages.append({
            "role": "system",
            "content": f"The user has provided their resume. Here's the extracted text:\n\n{resume_text}\n\nReview it and acknowledge what you see. Ask 1-2 clarifying questions if anything is unclear.",
        })

    response = await _get_client().chat.completions.create(
        model="gpt-4o",
        messages=system_messages + messages,
        temperature=0.7,
        max_tokens=600,
    )

    return response.choices[0].message.content


async def suggest_roles(query: str) -> list[dict]:
    """Given a dream role description, suggest specific companies and positions."""
    response = await _get_client().chat.completions.create(
        model="gpt-4o",
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "Given a dream role description, suggest 5-8 specific job positions. "
                    "Return JSON: {\"suggestions\": [{\"company\": \"...\", \"role\": \"...\", "
                    "\"location\": \"...\", \"salary_estimate\": \"...\", \"match_reason\": \"...\"}]}"
                    "\nBe specific with real companies. Include a mix of top-tier and realistic options."
                ),
            },
            {"role": "user", "content": query},
        ],
        temperature=0.7,
    )

    parsed = json.loads(response.choices[0].message.content)
    return parsed.get("suggestions", [])
