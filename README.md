# Jinsight

AI-powered journaling app. Write entries, get mood analysis and insights powered by OpenAI.

**Stack:** Next.js 16 · FastAPI · Supabase · OpenAI

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- A [Supabase](https://supabase.com) project
- An OpenAI API key

---

## Setup

### 1. Clone and copy env files

```bash
git clone <repo-url>
cd Jinsight

# Root .env — used by docker-compose for frontend build args
cp .env.example .env

# Backend env
cp backend/.env.example backend/.env

# Frontend env (local dev only, not needed for Docker)
cp frontend/.env.example frontend/.env
```

### 2. Fill in your credentials

**`.env`** (root — Docker only)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**`backend/.env`**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-api-key
```

**`frontend/.env`** (local dev only)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Run the database migrations

Apply `supabase/migrations/001_init.sql` via the Supabase dashboard SQL editor or the Supabase CLI.

---

## Running with Docker

```bash
docker compose up --build
```

| Service  | URL                   |
|----------|-----------------------|
| Frontend | http://localhost:3000 |
| Backend  | http://localhost:8000 |

> The `NEXT_PUBLIC_API_URL` is automatically set to `http://backend:8000` (Docker internal DNS) during the build — you don't need to set it yourself.

To stop:
```bash
docker compose down
```

---

## Local Development (without Docker)

**Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```
