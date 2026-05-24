import os
from pathlib import Path
from typing import List

from dotenv import load_dotenv
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import FastEmbedEmbeddings
from langchain_core.documents import Document
from supabase import create_client

load_dotenv(Path(__file__).parent.parent.parent / ".env")


class JobEmbeddingPipeline:
    def __init__(self, model_name: str = "BAAI/bge-small-en-v1.5", chunk_size: int = 1000, chunk_overlap: int = 200):
        self.embeddings = FastEmbedEmbeddings(model_name=model_name)
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", " ", ""],
        )
        self.supabase = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_SERVICE_KEY"],
        )

    def chunk_documents(self, documents: List[Document]) -> List[Document]:
        return self.splitter.split_documents(documents)

    def store(self, chunks: List[Document], title: str = "", company: str = "") -> None:
        texts = [chunk.page_content for chunk in chunks]
        vectors = self.embeddings.embed_documents(texts)
        rows = [
            {
                "title": title,
                "company": company,
                "content": chunk.page_content,
                "metadata": chunk.metadata,
                "embedding": vec,
            }
            for chunk, vec in zip(chunks, vectors)
        ]
        self.supabase.table("job_descriptions").insert(rows).execute()

    def search(self, query: str, k: int = 4) -> List[Document]:
        vector = self.embeddings.embed_query(query)
        response = self.supabase.rpc(
            "match_job_descriptions",
            {"query_embedding": vector, "match_count": k},
        ).execute()
        return [
            Document(page_content=row["content"], metadata=row.get("metadata", {}))
            for row in response.data
        ]
