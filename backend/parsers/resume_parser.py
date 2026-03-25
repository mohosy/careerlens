import io
import os
import json

import pdfplumber
from openai import AsyncOpenAI

from models.schemas import ResumeData

def _get_client():
    return AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract all text from a PDF file."""
    text_parts = []
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    return "\n".join(text_parts)


async def parse_resume(pdf_bytes: bytes) -> ResumeData:
    """Parse a resume PDF into structured data using GPT-4o."""
    raw_text = extract_text_from_pdf(pdf_bytes)

    if not raw_text.strip():
        return ResumeData()

    response = await _get_client().chat.completions.create(
        model="gpt-4o",
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a resume parser. Extract structured data from the resume text. "
                    "Return a JSON object with these fields:\n"
                    "- name: string (full name)\n"
                    "- email: string\n"
                    "- skills: string[] (technical and soft skills)\n"
                    "- experience: array of {title, company, duration, description}\n"
                    "- education: array of {degree, school, year, gpa?}\n"
                    "- projects: array of {name, description, technologies}\n"
                    "- summary: string (brief professional summary)\n"
                    "Be thorough. Extract every skill mentioned, including those implied by experience."
                ),
            },
            {
                "role": "user",
                "content": f"Parse this resume:\n\n{raw_text}",
            },
        ],
    )

    parsed = json.loads(response.choices[0].message.content)
    return ResumeData(**parsed)
