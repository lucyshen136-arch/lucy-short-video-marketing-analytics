from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from api.config import get_settings
from api.database import engine
from api.routers import dictionaries, dictionary_sets, videos

settings = get_settings()

app = FastAPI(title="Lucy Video Analytics API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(videos.router, prefix="/api/v1")
app.include_router(dictionaries.router, prefix="/api/v1")
app.include_router(dictionary_sets.router, prefix="/api/v1")


@app.get("/health")
def health():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception as exc:  # noqa: BLE001 — health endpoint
        db_status = f"error: {exc}"
    return {"status": "ok" if db_status == "ok" else "degraded", "database": db_status}
