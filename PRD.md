# PRD: AI Daily Journal with Insights

## Overview

A journaling web app where users write freely without AI interference. After saving an entry, AI processes it in the background to extract mood, themes, and key topics — surfacing patterns and insights over time through a dashboard.

## Problem

Journaling is valuable but most people don't revisit past entries. Insights about mood trends, recurring themes, and personal patterns get lost.

## Goals

- Give users a clean, distraction-free writing experience
- Surface meaningful patterns from journal entries without interrupting the writing process
- Demonstrate AI integration across RAG, document understanding, and personalization

## Non-Goals

- AI assistance, autocomplete, or suggestions during writing
- Social or sharing features
- Mobile app (web only)

## Features

### Core

| Feature | Description |
|---|---|
| Journal editor | Minimal rich-text editor, no AI in the loop |
| Entry saving | Saves to Supabase; triggers background AI processing |
| AI analysis | Extracts mood score, sentiment, themes, and key topics per entry |
| Mood trend graph | Line chart of mood over time |
| Pattern insight cards | AI-generated summaries of recurring themes (e.g. "You've mentioned work stress 6 times this month") |
| Natural language search | Ask questions like "what have I been anxious about?" — RAG over past entries |

### Stretch

- Weekly in-app insights digest
- Tag filtering on the entry list

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js (TypeScript) |
| Backend | FastAPI (Python) |
| Database | Supabase (Postgres + pgvector) |
| AI | Gemini API (Flash for analysis, embeddings for RAG) |
| Auth | Supabase Auth |
| Deployment | Vercel (frontend), DigitalOcean (backend via GitHub Student Pack) |

## AI Integration

1. **Document understanding** — parse each journal entry to extract structured metadata (mood score 1–10, sentiment, themes list, key topics)
2. **RAG** — embed each entry at save time; natural language queries retrieve semantically similar entries
3. **Personalization** — insight cards are generated from the user's own history, not generic content

The AI never sees a draft or partial entry — only completed, saved entries trigger processing.

## Data Model (simplified)

```
entries        id, user_id, content, created_at
entry_metadata id, entry_id, mood_score, sentiment, themes[], topics[], embedding
```

## User Flow

1. User opens app → lands on journal editor
2. Writes entry → clicks Save
3. Entry stored → background job sends to Gemini for analysis → metadata + embedding stored
4. User visits Dashboard → sees mood graph, insight cards, search bar
5. User types natural language query → RAG retrieves relevant entries

## QTMA Deliverable Checklist

- [x] Next.js frontend
- [x] FastAPI backend
- [x] Supabase / Postgres
- [x] Docker (backend containerized)
- [x] Gemini API integration
- [x] GitHub repo
- [x] Demonstrates: document understanding, RAG, personalization
