from pathlib import Path
from typing import List

from langchain_core.documents import Document


def load_job_description(source: str, title: str = "", company: str = "") -> List[Document]:
    """Load a job description from a .txt file, .pdf file, or raw text string."""
    path = Path(source)

    if path.exists() and path.suffix == ".txt":
        content = path.read_text(encoding="utf-8")
    elif path.exists() and path.suffix == ".pdf":
        from langchain_community.document_loaders import PyPDFLoader
        pages = PyPDFLoader(str(path)).load()
        content = "\n\n".join(p.page_content for p in pages)
    else:
        content = source

    return [Document(page_content=content, metadata={"title": title, "company": company})]
