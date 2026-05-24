from fastapi import APIRouter, HTTPException, Request

from app.rag.job_rag import JobDescriptionRAG
from app.schemas.job import JobMatchRequest, JobMatchResponse

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


def _get_rag(request: Request, groq_api_key: str | None) -> JobDescriptionRAG:
    if groq_api_key:
        return JobDescriptionRAG(
            cv_pipeline=request.app.state.cv_pipeline,
            job_pipeline=request.app.state.job_rag.job_pipeline,
            api_key=groq_api_key,
        )
    return request.app.state.job_rag


@router.post("/match", response_model=JobMatchResponse)
def match_job(request: Request, body: JobMatchRequest):
    groq_key = request.headers.get("X-Groq-API-Key")
    rag = _get_rag(request, groq_key)
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
