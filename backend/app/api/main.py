from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.applications import router as applications_router
from app.api.routes.cv import router as cv_router
from app.api.routes.jobs import router as jobs_router
from app.embeddings.cv_embeddings import CVEmbeddingPipeline
from app.embeddings.job_embeddings import JobEmbeddingPipeline
from app.rag.cv_rag import CVCopilot
from app.rag.job_rag import JobDescriptionRAG


@asynccontextmanager
async def lifespan(app: FastAPI):
    cv_pipeline = CVEmbeddingPipeline()
    job_pipeline = JobEmbeddingPipeline()
    app.state.cv_pipeline = cv_pipeline
    app.state.cv_copilot = CVCopilot(pipeline=cv_pipeline)
    app.state.job_rag = JobDescriptionRAG(cv_pipeline=cv_pipeline, job_pipeline=job_pipeline)
    yield


app = FastAPI(title="CV Copilot API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(applications_router)
app.include_router(cv_router)
app.include_router(jobs_router)


@app.get("/")
async def health_check():
    return {"status": "ok", "service": "cv-copilot"}


if __name__ == "__main__":
    uvicorn.run("app.api.main:app", host="0.0.0.0", port=8000, reload=True)
