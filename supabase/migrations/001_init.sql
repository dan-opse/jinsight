-- Enable pgvector extension for semantic search
create extension if not exists vector;

-- Journal entries
create table entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  content     text not null,
  created_at  timestamptz not null default now()
);

-- AI-extracted metadata + embeddings per entry
create table entry_metadata (
  id                uuid primary key default gen_random_uuid(),
  entry_id          uuid not null references entries(id) on delete cascade,
  mood_score        smallint check (mood_score between 1 and 10),
  sentiment         text,
  themes            text[],
  topics            text[],
  embedding         vector(768),
  processing_status text not null default 'pending',  -- pending | done | failed
  created_at        timestamptz not null default now()
);

-- Index for fast vector similarity search
create index on entry_metadata using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- RPC function for pgvector semantic search
create or replace function search_entries(
  query_embedding vector(768),
  user_id_input   uuid,
  match_count     int default 5
)
returns table (
  id         uuid,
  content    text,
  created_at timestamptz,
  similarity float
)
language sql stable
as $$
  select
    e.id,
    e.content,
    e.created_at,
    1 - (em.embedding <=> query_embedding) as similarity
  from entry_metadata em
  join entries e on e.id = em.entry_id
  where e.user_id = user_id_input
    and em.embedding is not null
  order by em.embedding <=> query_embedding
  limit match_count;
$$;

-- Row Level Security
alter table entries       enable row level security;
alter table entry_metadata enable row level security;

-- Users can only access their own entries
create policy "entries: owner access"
  on entries for all
  using (user_id = auth.uid());

-- entry_metadata is accessible only through owned entries
create policy "entry_metadata: owner access"
  on entry_metadata for all
  using (
    exists (
      select 1 from entries e
      where e.id = entry_metadata.entry_id
        and e.user_id = auth.uid()
    )
  );
