import os
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from supabase import create_client, Client
from app.middleware.auth import get_current_user
from app.services import gemini

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def get_supabase() -> Client:
    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])


@router.get("/mood")
async def mood_trend(
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    """Mood scores for the last 30 days, ordered by entry date."""
    since = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()

    result = supabase.table("entries").select(
        "created_at, entry_metadata(mood_score)"
    ).eq("user_id", user["sub"]).gte("created_at", since).order("created_at").execute()

    points = [
        {"date": row["created_at"], "mood_score": row["entry_metadata"][0]["mood_score"]}
        for row in result.data
        if row.get("entry_metadata") and row["entry_metadata"][0].get("mood_score") is not None
    ]
    return points


@router.get("/insights")
async def insight_cards(
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    """Generate AI insight cards on demand from the last 30 days of metadata."""
    since = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()

    result = supabase.table("entries").select(
        "entry_metadata(themes, topics)"
    ).eq("user_id", user["sub"]).gte("created_at", since).execute()

    metadata = [
        row["entry_metadata"][0]
        for row in result.data
        if row.get("entry_metadata") and row["entry_metadata"][0].get("themes")
    ]

    if not metadata:
        return {"insights": []}

    insights = await gemini.generate_insights(metadata)
    return {"insights": insights}


@router.get("/search")
async def search_entries(
    q: str,
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    """Semantic search over user's entries using pgvector."""
    if not q.strip():
        return []

    query_embedding = await gemini.embed_text(q)

    # Use Supabase RPC for pgvector cosine similarity search
    result = supabase.rpc("search_entries", {
        "query_embedding": query_embedding,
        "user_id_input": user["sub"],
        "match_count": 5,
    }).execute()

    return result.data
