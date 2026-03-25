import os
import json

from openai import AsyncOpenAI

from models.schemas import ResumeData, JobData, CardType

def _get_client():
    return AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


async def synthesize_research(
    resume: ResumeData,
    job: JobData,
    web_results: list[dict],
    youtube_results: list[dict],
    reddit_results: list[dict],
    glassdoor_results: list[dict],
    scraped_content: list[dict],
) -> list[dict]:
    """Take all raw research data and produce structured vision board cards."""

    # Build a comprehensive context for the LLM
    context = _build_context(
        resume, job, web_results, youtube_results,
        reddit_results, glassdoor_results, scraped_content
    )

    response = await _get_client().chat.completions.create(
        model="gpt-4o",
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": SYNTHESIS_PROMPT,
            },
            {
                "role": "user",
                "content": context,
            },
        ],
        temperature=0.7,
        max_tokens=4000,
    )

    parsed = json.loads(response.choices[0].message.content)
    return parsed.get("cards", [])


def _build_context(
    resume: ResumeData,
    job: JobData,
    web_results: list[dict],
    youtube_results: list[dict],
    reddit_results: list[dict],
    glassdoor_results: list[dict],
    scraped_content: list[dict],
) -> str:
    sections = []

    # Resume summary
    sections.append("=== CANDIDATE RESUME ===")
    sections.append(f"Name: {resume.name}")
    sections.append(f"Skills: {', '.join(resume.skills)}")
    for exp in resume.experience[:5]:
        sections.append(f"Experience: {exp.get('title', '')} at {exp.get('company', '')} ({exp.get('duration', '')})")
    for edu in resume.education[:3]:
        sections.append(f"Education: {edu.get('degree', '')} from {edu.get('school', '')} ({edu.get('year', '')})")
    for proj in resume.projects[:3]:
        sections.append(f"Project: {proj.get('name', '')} - {proj.get('description', '')}")

    # Job details
    sections.append("\n=== TARGET JOB ===")
    sections.append(f"Company: {job.company}")
    sections.append(f"Role: {job.role}")
    sections.append(f"Location: {job.location}")
    sections.append(f"Description: {job.description}")
    sections.append(f"Requirements: {', '.join(job.requirements)}")
    sections.append(f"Nice to haves: {', '.join(job.nice_to_haves)}")
    if job.salary_range:
        sections.append(f"Salary: {job.salary_range}")

    # Web research
    sections.append("\n=== WEB RESEARCH ===")
    for r in web_results[:15]:
        sections.append(f"[{r.get('source', 'web')}] {r['title']}: {r['snippet']}")

    # YouTube
    sections.append("\n=== YOUTUBE VIDEOS ===")
    for r in youtube_results[:8]:
        sections.append(f"Video: \"{r['title']}\" by {r.get('channel', 'unknown')} - {r.get('description', '')[:200]}")
        sections.append(f"  URL: {r['url']}, Thumbnail: {r.get('thumbnail', '')}")

    # Reddit
    sections.append("\n=== REDDIT DISCUSSIONS ===")
    for r in reddit_results[:10]:
        sections.append(f"[r/{r.get('subreddit', '')}] {r['title']} (score: {r.get('score', 0)}, {r.get('num_comments', 0)} comments)")
        if r.get("snippet"):
            sections.append(f"  {r['snippet'][:300]}")

    # Glassdoor
    sections.append("\n=== GLASSDOOR RESULTS ===")
    for r in glassdoor_results[:8]:
        sections.append(f"{r['title']}: {r['snippet']}")

    # Scraped deep content
    sections.append("\n=== DEEP CONTENT (from top sources) ===")
    for item in scraped_content[:5]:
        sections.append(f"Source: {item.get('url', '')}")
        sections.append(item.get("content", "")[:1500])

    return "\n".join(sections)


SYNTHESIS_PROMPT = """You are a career intelligence analyst. You've been given a candidate's resume, a target job listing, and deep research from multiple sources (web, YouTube, Reddit, Glassdoor).

Your job is to produce a set of vision board cards. Return a JSON object with a "cards" array. Each card has:
- "type": one of: company_overview, salary, employee_quote, interview_question, youtube_video, match_score, gap_analysis, skills_roadmap, quick_stats
- "title": card title
- "content": object with card-specific data (see below)
- "source_url": source link if applicable (null if synthesized)

Card content schemas:

1. company_overview: {description, size, industry, headquarters, founded, website, logo_query}
2. salary: {range, average, source_note, currency}
3. employee_quote: {quote, author, role, platform, sentiment} — use REAL quotes from the research
4. interview_question: {question, context, difficulty, tips} — use REAL questions from the research
5. youtube_video: {video_id, title, channel, thumbnail, description} — use REAL videos from the research
6. match_score: {score (0-100), strengths[], gaps[], summary}
7. gap_analysis: {gaps: [{skill, importance, suggestion, resource_url}]}
8. skills_roadmap: {skills: [{name, priority, time_estimate, resources[]}]}
9. quick_stats: {stats: [{label, value}]} — interview rounds, timeline, acceptance rate, etc.

IMPORTANT RULES:
- Generate exactly 1 company_overview, 1 match_score, 1 gap_analysis, 1 skills_roadmap, 1 quick_stats, 1 salary
- Generate 3-5 employee_quotes (only from REAL sources in the research, with real quotes)
- Generate 3-5 interview_questions (only REAL reported questions)
- Generate 2-4 youtube_videos (only REAL videos from the research data)
- For match_score, be honest and specific — don't inflate
- For gap_analysis, be actionable — include specific resources
- Include source_url wherever possible
- All data must be grounded in the research provided — do NOT hallucinate"""
