import os, json, secrets
from datetime import datetime, timezone
from typing import Any
import httpx
import psycopg
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel, Field
from .cast import CAST

app = FastAPI(title="GEPETO Reality Engine", version="3.0.0")

class DebateInput(BaseModel):
    theme: str = Field(min_length=3, max_length=240)
    room: str = "living"
    villa: str = "mauritius"

class LegacyImport(BaseModel):
    history: list[dict[str, Any]] = []
    topics: list[dict[str, Any]] = []
    votes: Any = None

def db():
    return psycopg.connect(os.environ["DATABASE_URL"])

@app.on_event("startup")
def initialize():
    with db() as conn:
        conn.execute(open(os.path.join(os.path.dirname(__file__),"schema.sql")).read())
        for p in CAST:
            conn.execute("""INSERT INTO residents(id,name,role,appearance,personality,model)
              VALUES(%s,%s,%s,%s,%s,%s) ON CONFLICT(id) DO UPDATE SET
              name=EXCLUDED.name,role=EXCLUDED.role,appearance=EXCLUDED.appearance,
              personality=EXCLUDED.personality,model=EXCLUDED.model""",
              (p["id"],p["name"],p["role"],p["appearance"],p["personality"],p["model"]))

@app.get("/health")
def health():
    try:
        with db() as conn: conn.execute("SELECT 1")
        return {"ok":True,"database":"connected","service":"gepeto-reality-engine"}
    except Exception as e:
        raise HTTPException(503,"Database unavailable")

@app.get("/api/system")
def system():
    return {"residents":CAST,"ai":{"primary":"OpenRouter","fallback":"Local OpenAI-compatible endpoint when configured"}}

async def infer(model: str, prompt: str):
    key=os.getenv("OPENROUTER_API_KEY")
    if key:
        try:
            async with httpx.AsyncClient(timeout=90) as c:
                r=await c.post("https://openrouter.ai/api/v1/chat/completions",
                    headers={"Authorization":f"Bearer {key}","Content-Type":"application/json","X-Title":"GEPETO"},
                    json={"model":model,"messages":[{"role":"user","content":prompt}],"temperature":0.8,"max_tokens":420})
                r.raise_for_status()
                return r.json()["choices"][0]["message"]["content"],"OpenRouter"
        except httpx.HTTPError:
            pass
    base,local_model=os.getenv("LOCAL_OPENAI_BASE_URL"),os.getenv("LOCAL_MODEL")
    if base and local_model:
        async with httpx.AsyncClient(timeout=120) as c:
            r=await c.post(base.rstrip("/")+"/chat/completions",
                json={"model":local_model,"messages":[{"role":"user","content":prompt}],"temperature":0.8,"max_tokens":420})
            r.raise_for_status()
            return r.json()["choices"][0]["message"]["content"],"Local inference"
    raise HTTPException(503,"No working inference route. Configure OpenRouter or a local compatible model endpoint.")

@app.post("/api/debate")
async def debate(req: DebateInput):
    transcript=[]; turns=[]
    for resident in CAST:
        prompt=(f"You are {resident['name']}, {resident['role']}, a fictional GEPETO villa resident. "
          f"Personality: {resident['personality']} Theme: {req.theme}. "
          f"Recent resident dialogue: {' '.join(transcript[-5:])}. "
          "Respond in first person in 70-100 words, engage another resident's argument where possible, "
          "take a distinct position, and ask one meaningful question. Never claim to be human.")
        reply,provider=await infer(resident["model"],prompt)
        item={"resident_id":resident["id"],"resident_name":resident["name"],"text":reply,
              "provider":provider,"model":resident["model"],"theme":req.theme,
              "created_at":datetime.now(timezone.utc).isoformat()}
        turns.append(item); transcript.append(resident["name"]+": "+reply)
    with db() as conn:
        with conn.cursor() as cur:
            cur.execute("INSERT INTO episodes(title,villa_id) VALUES(%s,%s) RETURNING id",(req.theme,req.villa))
            episode_id=cur.fetchone()[0]
            for t in turns:
                cur.execute("INSERT INTO turns(episode_id,resident_id,theme,content,provider,model) VALUES(%s,%s,%s,%s,%s,%s)",
                  (episode_id,t["resident_id"],req.theme,t["text"],t["provider"],t["model"]))
    return {"episode_id":str(episode_id),"turns":turns}

@app.post("/api/migration/import")
def import_legacy(payload: LegacyImport, authorization: str | None = Header(default=None)):
    expected=os.getenv("GEPETO_IMPORT_TOKEN","")
    supplied=(authorization or "").removeprefix("Bearer ").strip()
    if not expected or not secrets.compare_digest(supplied,expected):
        raise HTTPException(401,"Import authorization failed")
    raw=payload.model_dump()
    with db() as conn:
        conn.execute("INSERT INTO migration_batches(source,payload) VALUES(%s,%s)",
                     ("appdeploy-legacy",json.dumps(raw)))
    return {"stored":True,"history_records":len(payload.history),"topics":len(payload.topics),
            "votes_payload_present":payload.votes is not None,
            "note":"Raw batch stored intact. Normalize and reconcile records before production cutover."}
