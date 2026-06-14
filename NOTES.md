# Dev Notes

## Known Issues

### Gemini API quota exceeded (2026-06-13)
Hitting `429 RESOURCE_EXHAUSTED` with `limit: 0` on the free tier for `gemini-2.0-flash`.

- The current API key in `backend/.env` has zero free-tier quota on its Google Cloud project
- Standard AI Studio keys start with `AIza` — the current key starts with `AQ.` which may be a Vertex AI key without Gemini API quota
- **To fix**: generate a fresh key at https://aistudio.google.com and replace `GEMINI_API_KEY` in `backend/.env`
- The SDK migration from `google-generativeai` → `google-genai` (v2.8.0) is already done and correct
