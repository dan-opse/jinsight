import os
import json
from google import genai

_client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

_MODEL = "gemini-2.0-flash"
_EMBED_MODEL = "text-embedding-004"

ANALYSIS_PROMPT = """Analyze this journal entry and return JSON with exactly these fields:
- mood_score: integer 1-10 (1=very negative, 10=very positive)
- sentiment: one of "positive", "neutral", "negative"
- themes: list of up to 5 short theme strings (e.g. "work stress", "gratitude")
- topics: list of up to 5 specific topic strings (e.g. "meeting with manager", "exercise")

Return only valid JSON, no markdown fences.

Journal entry:
{content}"""

INSIGHT_PROMPT = """Based on these journal themes and topics from the past 30 days, write 3 concise insight cards.
Each card should be one sentence that surfaces a meaningful pattern (e.g. "You've mentioned work stress 6 times this month").
Return a JSON array of 3 strings.

Data:
{data}"""


async def analyze_entry(content: str) -> dict:
    response = _client.models.generate_content(
        model=_MODEL,
        contents=ANALYSIS_PROMPT.format(content=content),
    )
    return json.loads(response.text)


async def embed_text(text: str) -> list[float]:
    result = _client.models.embed_content(
        model=_EMBED_MODEL,
        contents=text,
    )
    return result.embeddings[0].values


async def generate_insights(themes_and_topics: list[dict]) -> list[str]:
    data = json.dumps(themes_and_topics)
    response = _client.models.generate_content(
        model=_MODEL,
        contents=INSIGHT_PROMPT.format(data=data),
    )
    return json.loads(response.text)
