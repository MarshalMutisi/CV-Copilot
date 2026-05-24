-- Enable the pgvector extension
create extension if not exists vector;

-- CV chunks with embeddings
create table if not exists public.documents (
  id        uuid primary key default gen_random_uuid(),
  content   text,
  metadata  jsonb,
  embedding vector(384)
);

-- Job description chunks with embeddings
create table if not exists public.job_descriptions (
  id        uuid primary key default gen_random_uuid(),
  title     text,
  company   text,
  content   text,
  metadata  jsonb,
  embedding vector(384),
  created_at timestamptz default now()
);

-- Similarity search on CV chunks
create or replace function match_documents (
  query_embedding vector(384),
  match_count     int   default null,
  filter          jsonb default '{}'
)
returns table (
  id         uuid,
  content    text,
  metadata   jsonb,
  similarity float
)
language sql stable as $$
  select
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where documents.metadata @> filter
  order by documents.embedding <=> query_embedding
  limit match_count;
$$;

-- Similarity search on job description chunks
create or replace function match_job_descriptions (
  query_embedding vector(384),
  match_count     int   default null,
  filter          jsonb default '{}'
)
returns table (
  id         uuid,
  title      text,
  company    text,
  content    text,
  metadata   jsonb,
  similarity float
)
language sql stable as $$
  select
    job_descriptions.id,
    job_descriptions.title,
    job_descriptions.company,
    job_descriptions.content,
    job_descriptions.metadata,
    1 - (job_descriptions.embedding <=> query_embedding) as similarity
  from job_descriptions
  where job_descriptions.metadata @> filter
  order by job_descriptions.embedding <=> query_embedding
  limit match_count;
$$;
