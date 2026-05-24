from pathlib import Path
from typing import List, Any

from langchain_community.document_loaders import (
    PyPDFLoader,
    TextLoader,
    CSVLoader,
    Docx2txtLoader,
)
from langchain_community.document_loaders import JSONLoader
from langchain_community.document_loaders.excel import UnstructuredExcelLoader


def load_all_documents(data_dir: str) -> List[Any]:
    """Load all supported files from a directory (PDF, TXT, CSV, Excel, Word, JSON)."""
    data_path = Path(data_dir).resolve()
    documents = []

    loaders = [
        ("*.pdf",  lambda f: PyPDFLoader(str(f))),
        ("*.txt",  lambda f: TextLoader(str(f))),
        ("*.csv",  lambda f: CSVLoader(str(f))),
        ("*.xlsx", lambda f: UnstructuredExcelLoader(str(f))),
        ("*.docx", lambda f: Docx2txtLoader(str(f))),
        ("*.json", lambda f: JSONLoader(str(f))),
    ]

    for pattern, make_loader in loaders:
        for f in data_path.glob(f"**/{pattern}"):
            try:
                documents.extend(make_loader(f).load())
            except Exception:
                pass

    return documents
