import tempfile
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request, UploadFile, File
from langchain_community.document_loaders import PyPDFLoader

from app.api.deps import get_cv_pipeline, get_cv_copilot
from app.schemas.cv import AskRequest, AskResponse
from app.rag.cv_rag import CVCopilot

router = APIRouter(prefix="/api/cv", tags=["cv"])


def _get_copilot(groq_api_key: str | None) -> CVCopilot:
    if groq_api_key:
        return CVCopilot(pipeline=get_cv_pipeline(), api_key=groq_api_key)
    return get_cv_copilot()


@router.get("/status")
def cv_status():
    return get_cv_pipeline().status()


@router.delete("/")
def delete_cv():
    get_cv_pipeline().clear()
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
        for doc in docs:
            doc.metadata["source"] = file.filename
        pipeline = get_cv_pipeline()
        pipeline.clear()
        chunks = pipeline.chunk_documents(docs)
        pipeline.store(chunks)
    finally:
        tmp_path.unlink(missing_ok=True)

    return {"message": "CV uploaded successfully", "chunks": len(chunks)}


@router.post("/ask", response_model=AskResponse)
def ask_cv(request: Request, body: AskRequest):
    groq_key = request.headers.get("X-Groq-API-Key")
    copilot = _get_copilot(groq_key)
    try:
        answer = copilot.ask(body.question, k=body.k)
    except Exception as e:
        if "429" in str(e) or "rate limit" in str(e).lower():
            raise HTTPException(status_code=429, detail="rate_limited")
        raise
    return AskResponse(question=body.question, answer=answer)
