import tempfile
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request, UploadFile, File

from langchain_community.document_loaders import PyPDFLoader

from app.schemas.cv import AskRequest, AskResponse
from app.rag.cv_rag import CVCopilot

router = APIRouter(prefix="/api/cv", tags=["cv"])


def _get_copilot(request: Request, groq_api_key: str | None) -> CVCopilot:
    if groq_api_key:
        return CVCopilot(pipeline=request.app.state.cv_pipeline, api_key=groq_api_key)
    return request.app.state.cv_copilot


@router.get("/status")
def cv_status(request: Request):
    pipeline = request.app.state.cv_pipeline
    return pipeline.status()


@router.delete("/")
def delete_cv(request: Request):
    pipeline = request.app.state.cv_pipeline
    pipeline.clear()
    return {"message": "CV removed successfully"}


@router.post("/upload")
async def upload_cv(request: Request, file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    contents = await file.read()
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(contents)
        tmp_path = Path(tmp.name)

    try:
        docs = PyPDFLoader(str(tmp_path)).load()
        # Attach filename to metadata so status() can surface it
        for doc in docs:
            doc.metadata["source"] = file.filename
        pipeline = request.app.state.cv_pipeline
        pipeline.clear()
        chunks = pipeline.chunk_documents(docs)
        pipeline.store(chunks)
    finally:
        tmp_path.unlink(missing_ok=True)

    return {"message": "CV uploaded successfully", "chunks": len(chunks)}


@router.post("/ask", response_model=AskResponse)
def ask_cv(request: Request, body: AskRequest):
    groq_key = request.headers.get("X-Groq-API-Key")
    copilot = _get_copilot(request, groq_key)
    try:
        answer = copilot.ask(body.question, k=body.k)
    except Exception as e:
        if "429" in str(e) or "rate limit" in str(e).lower():
            raise HTTPException(status_code=429, detail="rate_limited")
        raise
    return AskResponse(question=body.question, answer=answer)
