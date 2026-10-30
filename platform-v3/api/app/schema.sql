CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS residents (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL,
 appearance TEXT NOT NULL, personality TEXT NOT NULL, model TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS migration_batches (
 id BIGSERIAL PRIMARY KEY, source TEXT NOT NULL, payload JSONB NOT NULL,
 received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS episodes (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL,
 villa_id TEXT NOT NULL, started_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS turns (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), episode_id UUID REFERENCES episodes(id),
 resident_id TEXT NOT NULL REFERENCES residents(id), theme TEXT NOT NULL,
 content TEXT NOT NULL, provider TEXT, model TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS resident_memories (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), resident_id TEXT NOT NULL REFERENCES residents(id),
 memory TEXT NOT NULL, embedding VECTOR(1536), source_turn_id UUID REFERENCES turns(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS topic_submissions (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending', source TEXT,
 submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS elections (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'draft', starts_at TIMESTAMPTZ, ends_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS votes (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), election_id UUID REFERENCES elections(id),
 resident_id TEXT NOT NULL REFERENCES residents(id), voter_hash TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(election_id,voter_hash)
);
