import os
from pathlib import Path
from typing import List, Any

from dotenv import load_dotenv
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import FastEmbedEmbeddings
from langchain_core.documents import Document
from supabase import create_client, Client

load_dotenv(Path(__file__).parent.parent.parent / ".env")


class SupabaseVectorDB:
    def __init__(self, client: Client, embeddings: FastEmbedEmbeddings,
                 table: str = "documents", match_fn: str = "match_documents"):
        self.client = client
        self.embeddings = embeddings
        self.table = table
        self.match_fn = match_fn

    def add_documents(self, documents: List[Document]) -> None:
        texts = [doc.page_content for doc in documents]
        vectors = self.embeddings.embed_documents(texts)
        rows = [
            {"content": doc.page_content, "metadata": doc.metadata, "embedding": vec}
            for doc, vec in zip(documents, vectors)
        ]
        self.client.table(self.table).insert(rows).execute()

    def similarity_search(self, query: str, k: int = 4) -> List[Document]:
        vector = self.embeddings.embed_query(query)
        response = self.client.rpc(
            self.match_fn,
            {"query_embedding": vector, "match_count": k},
        ).execute()
        return [
            Document(page_content=row["content"], metadata=row.get("metadata", {}))
            for row in response.data
        ]


class CVEmbeddingPipeline:
    def __init__(self, model_name: str = "BAAI/bge-small-en-v1.5", chunk_size: int = 1000, chunk_overlap: int = 200):
        self.embeddings = FastEmbedEmbeddings(model_name=model_name)
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", " ", ""],
        )
        self.vector_db = SupabaseVectorDB(
            client=create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"]),
            embeddings=self.embeddings,
        )

    def chunk_documents(self, documents: List[Any]) -> List[Document]:
        return self.splitter.split_documents(documents)

    def store(self, chunks: List[Document]) -> None:
        self.vector_db.add_documents(chunks)

    def search(self, query: str, k: int = 4) -> List[Document]:
        return self.vector_db.similarity_search(query, k=k)

    def clear(self) -> None:
        self.vector_db.client.table("documents").delete().neq("content", "").execute()

    def status(self) -> dict:
        res = self.vector_db.client.table("documents").select("metadata", count="exact").limit(1).execute()
        count = res.count or 0
        filename = None
        if count > 0 and res.data:
            filename = res.data[0].get("metadata", {}).get("source")
        return {"has_cv": count > 0, "filename": filename, "chunks": count}
