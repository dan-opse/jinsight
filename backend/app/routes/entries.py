import os
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel
from supabase import create_client, Client
from app.middleware.auth import get_current_user
from app.services import gemini

router = APIRouter(prefix="/entries", tags=["entries"])


def get_supabase() -> Client:
    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])


class EntryCreate(BaseModel):
    content: str


async def process_entry(entry_id: str, content: str, supabase: Client) -> None:
    try:
        analysis = await gemini.analyze_entry(content)
        embedding = await gemini.embed_text(content)

        supabase.table("entry_metadata").update({
            "mood_score": analysis.get("mood_score"),
            "sentiment": analysis.get("sentiment"),
            "themes": analysis.get("themes", []),
            "topics": analysis.get("topics", []),
            "embedding": embedding,
            "processing_status": "done",
        }).eq("entry_id", entry_id).execute()
    except Exception as e:
        supabase.table("entry_metadata").update(
            {"processing_status": "failed"}
        ).eq("entry_id", entry_id).execute()
        raise


@router.post("/", status_code=201)
async def create_entry(
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

    background_tasks.add_task(process_entry, entry_id, body.content, supabase)

    return {"id": entry_id, "processing_status": "pending"}


@router.post("/{entry_id}/analyze")
async def analyze_entry_route(
    entry_id: str,
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    result = supabase.table("entries").select("id, content, user_id").eq("id", entry_id).single().execute()
    if not result.data or result.data["user_id"] != user["sub"]:
        raise HTTPException(status_code=404, detail="Entry not found")

    try:
        await process_entry(entry_id, result.data["content"], supabase)
    except Exception as e:
        import traceback
        traceback.print_exc()
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
