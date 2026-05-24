import os
from contextlib import asynccontextmanager
from pathlib import Path

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from app.api.routes.applications import router as applications_router
from app.api.routes.cv import router as cv_router
from app.api.routes.jobs import router as jobs_router

STATIC_DIR = Path(__file__).resolve().parent.parent.parent / "static"


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield  # Models load lazily on first request — keeps startup instant


app = FastAPI(title="CV Copilot API", version="1.0.0", lifespan=lifespan)

_frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[_frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(applications_router)
app.include_router(cv_router)
app.include_router(jobs_router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "cv-copilot"}


if STATIC_DIR.exists():
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        for candidate in [
            STATIC_DIR / full_path / "index.html",
            STATIC_DIR / full_path,
            STATIC_DIR / "index.html",
        ]:
            if candidate.is_file():
                return FileResponse(str(candidate))
        raise HTTPException(status_code=404)


if __name__ == "__main__":
    uvicorn.run("app.api.main:app", host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
