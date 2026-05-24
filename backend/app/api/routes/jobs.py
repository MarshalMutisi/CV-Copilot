from fastapi import APIRouter, HTTPException, Request

from app.api.deps import get_cv_pipeline, get_job_rag
from app.rag.job_rag import JobDescriptionRAG
from app.schemas.job import JobMatchRequest, JobMatchResponse

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


def _get_rag(groq_api_key: str | None) -> JobDescriptionRAG:
    if groq_api_key:
        from app.embeddings.job_embeddings import JobEmbeddingPipeline
        return JobDescriptionRAG(
            cv_pipeline=get_cv_pipeline(),
            job_pipeline=JobEmbeddingPipeline(),
            api_key=groq_api_key,
        )
    return get_job_rag()


@router.post("/match", response_model=JobMatchResponse)
def match_job(request: Request, body: JobMatchRequest):
    groq_key = request.headers.get("X-Groq-API-Key")
    rag = _get_rag(groq_key)
    try:
        rag.ingest(body.job_description, title=body.role, company=body.company)
        return JobMatchResponse(
            company=body.company,
            role=body.role,
            fit_analysis=rag.analyze_fit(),
            gaps=rag.find_gaps(),
            cover_letter=rag.write_cover_letter(),
        )
    except Exception as e:
        if "429" in str(e) or "rate limit" in str(e).lower():
            raise HTTPException(status_code=429, detail="rate_limited")
        raise
