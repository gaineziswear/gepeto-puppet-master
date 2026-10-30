# GEPETO Platform v3 — migration foundation

This directory introduces the open-source-first replacement architecture without deleting or replacing the existing browser MVP.

## Architecture
- FastAPI service (Python)
- PostgreSQL + pgvector for episodes, turns, resident memories, topics and votes
- Redis reserved for realtime jobs and queue coordination
- OpenRouter as primary inference gateway
- Optional local OpenAI-compatible endpoint (Ollama/vLLM) as fallback
- Next.js/Babylon.js frontend to be introduced in a later migration phase
- Docker Compose for reproducible development

## Preserve the legacy app
The existing root app remains the reference MVP. Keep its debate content, cast, relationship values and topic/vote state until a verified export/import has completed.

## Local setup
1. Copy `.env.example` to `.env` and set strong secrets.
2. Run `docker compose up --build`.
3. API health: `http://localhost:8000/health`.

## Status and limitations
This is the backend foundation, not a production cutover. The import endpoint persists the legacy JSON payload as a raw migration batch so no field is silently discarded; mapping into normalized episode/turn/topic/vote tables remains a verification step. The local inference endpoint must be supplied by separate GPU-capable compute. Do not run a large local model on a small web/database host.

## Villa rendering
The final realistic villa is planned for Babylon.js with Blender-authored GLB assets, PBR materials, animation, mobile LODs and iPhone Safari performance testing. The current MVP's 2D dashboard is retained until the new scene is ready.


## Backend configuration and safety

The API no longer runs DDL or seeds the database at application startup. Apply the checked-in Supabase migrations first, then configure `DATABASE_URL` as an encrypted server-side secret. The database role used by the API must be able to read/write the required application tables; never expose a database password or service-role key to browser code.

For production, set `OPENROUTER_API_KEY` and optionally `LOCAL_OPENAI_BASE_URL` plus `LOCAL_MODEL` in the hosting provider's secret manager. Set `CORS_ORIGINS` to the exact frontend origins when the API and web app are hosted separately. The API reports provider configuration at `/api/system`, but never returns secret values.

The legacy import endpoint requires `GEPETO_IMPORT_TOKEN`. It stores the submitted payload as a raw, auditable batch; it does not yet normalize records or authorize cutover. Export and inspect the actual legacy AppDeploy data shape before importing.

## Current implementation boundary

This branch is a migration foundation, not a live production service. Supabase is provisioned and the base schema/migrations are present, but the API is not yet connected because its production database connection secret has not been installed. No legacy data has been imported, and the original AppDeploy application remains untouched.
