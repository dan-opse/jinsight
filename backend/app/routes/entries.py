import logging
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from pydantic import BaseModel
from supabase import Client
from app.middleware.auth import get_current_user
from app.dependencies import get_supabase
from app.limiter import limiter
from app.services import llm

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/entries", tags=["entries"])


class EntryCreate(BaseModel):
    content: str


async def process_entry(entry_id: str, content: str, supabase: Client) -> None:
    try:
        analysis = await llm.analyze_entry(content)
        embedding = await llm.embed_text(content)

        supabase.table("entry_metadata").update({
            "mood_score": analysis.get("mood_score"),
            "sentiment": analysis.get("sentiment"),
            "themes": analysis.get("themes", []),
            "topics": analysis.get("topics", []),
            "embedding": embedding,
            "processing_status": "done",
        }).eq("entry_id", entry_id).execute()
    except Exception:
        supabase.table("entry_metadata").update(
            {"processing_status": "failed"}
        ).eq("entry_id", entry_id).execute()
        raise


async def _run_process_entry_bg(entry_id: str, content: str, supabase: Client) -> None:
    try:
        await process_entry(entry_id, content, supabase)
    except Exception:
        logger.exception("Background analysis failed for entry %s", entry_id)


@router.post("/", status_code=201)
@limiter.limit("10/minute")
async def create_entry(
    request: Request,
    body: EntryCreate,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    if not body.content.strip():
        raise HTTPException(status_code=400, detail="Content cannot be empty")

    user_id = user["sub"]

    entry = supabase.table("entries").insert({
        "user_id": user_id,
        "content": body.content,
    }).execute()

    entry_id = entry.data[0]["id"]

    # Seed a pending metadata row so processing_status is visible immediately
    supabase.table("entry_metadata").insert({"entry_id": entry_id}).execute()

    background_tasks.add_task(_run_process_entry_bg, entry_id, body.content, supabase)

    return {"id": entry_id, "processing_status": "pending"}


@router.post("/{entry_id}/analyze")
@limiter.limit("10/minute")
async def analyze_entry_route(
    request: Request,
    entry_id: str,
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    result = supabase.table("entries").select("id, content, user_id").eq("id", entry_id).single().execute()
    if not result.data or result.data["user_id"] != user["sub"]:
        raise HTTPException(status_code=404, detail="Entry not found")

    meta = supabase.table("entry_metadata").select("processing_status").eq("entry_id", entry_id).execute()
    if meta.data and meta.data[0].get("processing_status") == "done":
        return {"processing_status": "done"}

    try:
        await process_entry(entry_id, result.data["content"], supabase)
    except Exception as e:
        logger.exception("Analysis failed for entry %s", entry_id)
        raise HTTPException(status_code=500, detail=str(e))

    return {"processing_status": "done"}


@router.get("/")
async def list_entries(
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    result = supabase.table("entries").select(
        "id, content, created_at, entry_metadata(mood_score, processing_status)"
    ).eq("user_id", user["sub"]).order("created_at", desc=True).execute()

    return result.data
