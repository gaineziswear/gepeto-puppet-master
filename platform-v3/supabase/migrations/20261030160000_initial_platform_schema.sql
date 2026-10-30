create extension if not exists vector with schema extensions;
create table if not exists public.residents (id text primary key,name text not null,role text not null,appearance text not null,personality text not null,model text not null,created_at timestamptz not null default now());
create table if not exists public.migration_batches (id bigint generated always as identity primary key,source text not null,payload jsonb not null,received_at timestamptz not null default now());
create table if not exists public.episodes (id uuid primary key default gen_random_uuid(),title text not null,villa_id text not null,started_at timestamptz not null default now());
create table if not exists public.turns (id uuid primary key default gen_random_uuid(),episode_id uuid not null references public.episodes(id) on delete cascade,resident_id text not null references public.residents(id),theme text not null,content text not null,provider text,model text,created_at timestamptz not null default now());
create table if not exists public.resident_memories (id uuid primary key default gen_random_uuid(),resident_id text not null references public.residents(id) on delete cascade,memory text not null,embedding extensions.vector(1536),source_turn_id uuid references public.turns(id) on delete set null,created_at timestamptz not null default now());
create table if not exists public.topic_submissions (id uuid primary key default gen_random_uuid(),title text not null,status text not null default 'pending' check(status in ('pending','approved','rejected','used')),source text,submitted_at timestamptz not null default now());
create table if not exists public.elections (id uuid primary key default gen_random_uuid(),title text not null,status text not null default 'draft' check(status in ('draft','open','closed','published')),starts_at timestamptz,ends_at timestamptz,created_at timestamptz not null default now());
create table if not exists public.votes (id uuid primary key default gen_random_uuid(),election_id uuid not null references public.elections(id) on delete cascade,resident_id text not null references public.residents(id),voter_hash text not null,created_at timestamptz not null default now(),unique(election_id,voter_hash));
alter table public.residents enable row level security;
alter table public.migration_batches enable row level security;
alter table public.episodes enable row level security;
alter table public.turns enable row level security;
alter table public.resident_memories enable row level security;
alter table public.topic_submissions enable row level security;
alter table public.elections enable row level security;
alter table public.votes enable row level security;
insert into public.residents(id,name,role,appearance,personality,model) values
('maya','Maya Chen','The Strategist','27-year-old East Asian woman, sleek black bob','Analytical, measured, competitive and observant; values evidence and institutional accountability.','openai/gpt-4.1-mini'),
('darius','Darius Okafor','The Challenger','31-year-old Black man, close-cropped hair','Direct, principled, provocative and confident; challenges authority and rejects performative consensus.','anthropic/claude-3.7-sonnet'),
('sofia','Sofia Alvarez','The Connector','26-year-old Latina woman, long dark curls','Empathetic, perceptive and persuasive; reads group dynamics and spots double standards.','x-ai/grok-3-mini'),
('theo','Theo Bennett','The Skeptic','29-year-old white British man, tousled auburn hair','Sceptical, witty and independent; tests assumptions and questions source quality.','google/gemini-2.5-flash'),
('amara','Amara Diallo','The Idealist','28-year-old West African woman, short natural curls','Idealistic, courageous and reflective; believes ambition should create shared value.','mistralai/mistral-small')
on conflict(id) do update set name=excluded.name,role=excluded.role,appearance=excluded.appearance,personality=excluded.personality,model=excluded.model;
-- Intentionally no anon/authenticated policies yet: all data access is backend-only until audience auth and role policies are implemented.