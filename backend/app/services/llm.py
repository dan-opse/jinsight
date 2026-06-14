import os
import json
import logging
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

_client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])

_MODEL = "gpt-5-nano"
_EMBED_MODEL = "text-embedding-3-small"
_EMBED_DIM = 768  # must match vector(768) in supabase/migrations/001_init.sql

ANALYSIS_PROMPT = """Analyze this journal entry and return JSON with exactly these fields:
- mood_score: integer 1-10 (1=very negative, 10=very positive)
- sentiment: one of "positive", "neutral", "negative"
- themes: list of up to 5 short theme strings (e.g. "work stress", "gratitude")
- topics: list of up to 5 specific topic strings (e.g. "meeting with manager", "exercise")

Return only valid JSON.

Journal entry:
{content}"""

INSIGHT_PROMPT = """Based on these journal themes and topics from the past 30 days, write 3 concise insight cards.
Each card should be one sentence that surfaces a meaningful pattern (e.g. "You've mentioned work stress 6 times this month").
Return JSON shaped as {{"insights": ["card 1", "card 2", "card 3"]}}.

Data:
{data}"""


async def analyze_entry(content: str) -> dict:
    response = await _client.chat.completions.create(
        model=_MODEL,
        messages=[{"role": "user", "content": ANALYSIS_PROMPT.format(content=content)}],
        response_format={"type": "json_object"},
    )
    text = response.choices[0].message.content
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        logger.error("OpenAI returned non-JSON for analyze_entry: %s", text)
        raise


async def embed_text(text: str) -> list[float]:
    result = await _client.embeddings.create(
        model=_EMBED_MODEL,
        input=text,
        dimensions=_EMBED_DIM,
    )
    return result.data[0].embedding


async def generate_insights(themes_and_topics: list[dict]) -> list[str]:
    data = json.dumps(themes_and_topics)
    response = await _client.chat.completions.create(
        model=_MODEL,
        messages=[{"role": "user", "content": INSIGHT_PROMPT.format(data=data)}],
        response_format={"type": "json_object"},
    )
    text = response.choices[0].message.content
    try:
        return json.loads(text)["insights"]
    except (json.JSONDecodeError, KeyError):
        logger.error("OpenAI returned bad insights JSON: %s", text)
        raise
