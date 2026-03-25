import asyncio
import uuid
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from sse_starlette.sse import EventSourceResponse

from models.schemas import BoardCreate, ResearchProgress, ResumeData, JobData
from parsers.resume_parser import parse_resume, extract_text_from_pdf
from parsers.job_parser import parse_job_listing
from research.engine import ResearchEngine
from research.conversation import chat as ai_chat

load_dotenv()

# In-memory stores
progress_streams: dict[str, asyncio.Queue] = {}
resume_store: dict[str, tuple[ResumeData, str]] = {}  # session_id -> (parsed, raw_text)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    progress_streams.clear()
    resume_store.clear()


app = FastAPI(title="CareerLens API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health ──────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok"}


# ── Chat ────────────────────────────────────────────────

class ChatRequest(BaseModel):
    session_id: str
    messages: list[dict]
    resume_text: Optional[str] = None


@app.post("/api/chat")
async def api_chat(req: ChatRequest):
    """Multi-turn conversation endpoint."""
    # If there's stored resume context for this session, include it
    stored_resume_text = None
    if req.session_id in resume_store:
        _, stored_resume_text = resume_store[req.session_id]

    resume_text = req.resume_text or stored_resume_text
    response = await ai_chat(req.messages, resume_text=resume_text)
    return {"reply": response}


# ── Resume Upload ───────────────────────────────────────

@app.post("/api/upload-resume")
async def api_upload_resume(
    session_id: str = Form(...),
    file: UploadFile = File(...),
):
    """Upload and parse a resume, storing it for the session."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    raw_text = extract_text_from_pdf(contents)
    resume_data = await parse_resume(contents)
    resume_store[session_id] = (resume_data, raw_text)

    return {"status": "ok", "resume": resume_data, "raw_text": raw_text}


# ── Research (conversation-initiated) ───────────────────

class ResearchStartRequest(BaseModel):
    session_id: str
    company: str
    role: str


@app.post("/api/research/start")
async def api_start_research_from_chat(req: ResearchStartRequest):
    """Start deep research from the conversation flow."""
    board_id = str(uuid.uuid4())

    queue: asyncio.Queue = asyncio.Queue()
    progress_streams[board_id] = queue

    # Get stored resume
    if req.session_id not in resume_store:
        raise HTTPException(status_code=400, detail="No resume uploaded for this session")

    resume_data, _ = resume_store[req.session_id]

    # Build a synthetic JobData from the conversation
    job_data = JobData(
        company=req.company,
        role=req.role,
        description=f"{req.role} at {req.company}",
        requirements=[],
        nice_to_haves=[],
        url="",
    )

    engine = ResearchEngine(board_id, queue)
    asyncio.create_task(engine.run(resume_data, job_data))

    return {"board_id": board_id, "status": "researching"}


# ── Legacy endpoints (kept for compatibility) ──────────

@app.post("/api/parse-resume")
async def api_parse_resume(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    resume_data = await parse_resume(contents)
    return resume_data


@app.post("/api/parse-job")
async def api_parse_job(job_url: str = Form(...)):
    job_data = await parse_job_listing(job_url)
    return job_data


@app.post("/api/research")
async def api_start_research(
    job_url: str = Form(...),
    file: UploadFile = File(...),
):
    board_id = str(uuid.uuid4())

    queue: asyncio.Queue = asyncio.Queue()
    progress_streams[board_id] = queue

    contents = await file.read()
    resume_data = await parse_resume(contents)
    job_data = await parse_job_listing(job_url)

    engine = ResearchEngine(board_id, queue)
    asyncio.create_task(engine.run(resume_data, job_data))

    return {"board_id": board_id, "status": "researching"}


@app.get("/api/research/{board_id}/stream")
async def stream_research_progress(board_id: str):
    queue = progress_streams.get(board_id)
    if not queue:
        raise HTTPException(status_code=404, detail="Research session not found")

    async def event_generator():
        while True:
            data = await queue.get()
            if data is None:
                yield {"event": "complete", "data": "done"}
                break
            yield {"event": "progress", "data": data}

    return EventSourceResponse(event_generator())


@app.get("/api/research/{board_id}/results")
async def get_research_results(board_id: str):
    engine = ResearchEngine.get_results(board_id)
    if not engine:
        raise HTTPException(status_code=404, detail="Results not found")
    return engine
