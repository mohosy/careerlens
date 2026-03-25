from pydantic import BaseModel
from enum import Enum
from typing import Optional


class BoardStatus(str, Enum):
    pending = "pending"
    researching = "researching"
    complete = "complete"
    failed = "failed"


class CardType(str, Enum):
    company_overview = "company_overview"
    salary = "salary"
    employee_quote = "employee_quote"
    interview_question = "interview_question"
    youtube_video = "youtube_video"
    match_score = "match_score"
    gap_analysis = "gap_analysis"
    skills_roadmap = "skills_roadmap"
    quick_stats = "quick_stats"


class ResumeData(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    skills: list[str] = []
    experience: list[dict] = []
    education: list[dict] = []
    projects: list[dict] = []
    summary: Optional[str] = None


class JobData(BaseModel):
    company: str
    role: str
    location: Optional[str] = None
    description: str
    requirements: list[str] = []
    nice_to_haves: list[str] = []
    salary_range: Optional[str] = None
    url: str


class BoardCreate(BaseModel):
    job_url: str


class CardOut(BaseModel):
    id: str
    board_id: str
    type: CardType
    title: str
    content: dict
    source_url: Optional[str] = None
    position: int


class ResearchProgress(BaseModel):
    board_id: str
    message: str
    stage: str  # "searching", "analyzing", "generating"
    progress: float  # 0.0 to 1.0
