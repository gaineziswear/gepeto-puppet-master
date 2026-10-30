import json
import logging
import os
import secrets
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlparse

import httpx
import psycopg
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .cast import CAST

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("gepeto.api")

app = FastAPI(title="GEPETO Reality Engine", version="3.0.1")

origins = [value.strip() for value in os.getenv("CORS_ORIGINS", "").split(",") if value.strip()]
if origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST"],
        allow_headers=["Authorization", "Content-Type"],
    )


class DebateInput(BaseModel):
    theme: str = Field(min_length=3, max_length=240)
    room: str = Field(default="living", min_length=1, max_length=48)
    villa: str = Field(default="mauritius", min_length=1, max_length=64)


class LegacyImport(BaseModel):
    history: list[dict[str, Any]] = Field(default_factory=list)
    topics: list[dict[str, Any]] = Field(default_factory=list)
    votes: Any = None


def db():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is not configured")
    return psycopg.connect(database_url, connect_timeout=8)


@app.get("/health")
def health():
    try:
        with db() as conn:
            conn.execute("SELECT 1")
        return {"ok": True, "database": "connected", "service": "gepeto-reality-engine"}
    except Exception:
        logger.exception("Database health check failed")
        raise HTTPException(503, "Database unavailable or DATABASE_URL is not configured")


@app.get("/api/system")
def system():
    return {
        "residents": CAST,
        "ai": {
            "primary": "OpenRouter",
            "primary_configured": bool(os.getenv("OPENROUTER_API_KEY")),
            "fallback": "Local OpenAI-compatible endpoint",
            "fallback_configured": bool(os.getenv("LOCAL_OPENAI_BASE_URL") and os.getenv("LOCAL_MODEL")),
        },
    }


async def infer(model: str, prompt: str):
    key = os.getenv("OPENROUTER_API_KEY")
    failures = []

    if key:
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(75.0, connect=10.0)) as client:
                response = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {key}",
                        "Content-Type": "application/json",
                        "X-Title": "GEPETO Puppet Master",
                    },
                    json={
                        "model": model,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.8,
                        "max_tokens": 420,
                    },
                )
                response.raise_for_status()
                body = response.json()
                text = body["choices"][0]["message"]["content"]
                if not isinstance(text, str) or not text.strip():
                    raise ValueError("Provider returned an empty completion")
                return text.strip(), "OpenRouter"
        except (httpx.HTTPError, ValueError, KeyError, IndexError) as exc:
            status = getattr(getattr(exc, "response", None), "status_code", None)
            failures.append(f"OpenRouter failure (HTTP {status})" if status else "OpenRouter response failure")
            logger.warning("OpenRouter inference failed for model %s: %s", model, type(exc).__name__)

    base_url = os.getenv("LOCAL_OPENAI_BASE_URL")
    local_model = os.getenv("LOCAL_MODEL")
    if base_url and local_model:
        parsed = urlparse(base_url)
        if parsed.scheme not in ("http", "https") or not parsed.netloc:
            raise HTTPException(503, "LOCAL_OPENAI_BASE_URL must be a valid HTTP(S) URL")
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(120.0, connect=10.0)) as client:
                response = await client.post(
                    base_url.rstrip("/") + "/chat/completions",
                    json={
                        "model": local_model,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.8,
                        "max_tokens": 420,
                    },
                )
                response.raise_for_status()
                body = response.json()
                text = body["choices"][0]["message"]["content"]
                if not isinstance(text, str) or not text.strip():
                    raise ValueError("Local provider returned an empty completion")
                return text.strip(), "Local inference"
        except (httpx.HTTPError, ValueError, KeyError, IndexError) as exc:
            logger.warning("Local inference failed: %s", type(exc).__name__)
            failures.append("Local inference failure")

    detail = "; ".join(failures) if failures else "No inference provider is configured"
    raise HTTPException(503, f"No working inference route. {detail}")


@app.post("/api/debate")
async def debate(req: DebateInput):
    transcript = []
    turns = []
    for resident in CAST:
        prompt = (
            f"You are {resident['name']}, {resident['role']}, a fictional GEPETO villa resident. "
            f"Personality: {resident['personality']} Theme: {req.theme}. "
            f"Recent resident dialogue: {' '.join(transcript[-5:])}. "
            "Respond in first person in 70-100 words, engage another resident's argument where possible, "
            "take a distinct position, and ask one meaningful question. Never claim to be human."
        )
        reply, provider = await infer(resident["model"], prompt)
        item = {
            "resident_id": resident["id"],
            "resident_name": resident["name"],
            "text": reply,
            "provider": provider,
            "model": resident["model"],
            "theme": req.theme,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        turns.append(item)
        transcript.append(resident["name"] + ": " + reply)

    try:
        with db() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO episodes(title,villa_id) VALUES(%s,%s) RETURNING id",
                    (req.theme, req.villa),
                )
                episode_id = cur.fetchone()[0]
                for turn in turns:
                    cur.execute(
                        """INSERT INTO turns
                           (episode_id,resident_id,theme,content,provider,model)
                           VALUES(%s,%s,%s,%s,%s,%s)""",
                        (
                            episode_id,
                            turn["resident_id"],
                            req.theme,
                            turn["text"],
                            turn["provider"],
                            turn["model"],
                        ),
                    )
    except Exception:
        logger.exception("Failed to persist generated episode")
        raise HTTPException(503, "Episode generation completed but persistence failed; retry after checking database health")

    return {"episode_id": str(episode_id), "turns": turns}


@app.post("/api/migration/import")
def import_legacy(payload: LegacyImport, authorization: str | None = Header(default=None)):
    expected = os.getenv("GEPETO_IMPORT_TOKEN", "")
    supplied = (authorization or "").removeprefix("Bearer ").strip()
    if not expected or not secrets.compare_digest(supplied, expected):
        raise HTTPException(401, "Import authorization failed")

    raw = payload.model_dump()
    try:
        with db() as conn:
            conn.execute(
                "INSERT INTO migration_batches(source,payload) VALUES(%s,%s)",
                ("appdeploy-legacy", json.dumps(raw)),
            )
    except Exception:
        logger.exception("Legacy migration batch could not be stored")
        raise HTTPException(503, "Migration database unavailable")

    return {
        "stored": True,
        "history_records": len(payload.history),
        "topics": len(payload.topics),
        "votes_payload_present": payload.votes is not None,
        "note": "Raw batch stored intact. Normalize and reconcile records before production cutover.",
    }
