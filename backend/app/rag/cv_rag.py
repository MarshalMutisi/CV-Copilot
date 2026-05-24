import os
from pathlib import Path

from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from app.embeddings.cv_embeddings import CVEmbeddingPipeline

load_dotenv(Path(__file__).parent.parent.parent / ".env")

PROMPT = ChatPromptTemplate.from_template("""
You are a helpful assistant that answers questions about a candidate's CV.
Use only the context below to answer. If the answer is not in the context, say so.

Context:
{context}

Question: {question}

Answer:
""")


class CVCopilot:
    def __init__(self, model: str = "llama-3.3-70b-versatile", pipeline: CVEmbeddingPipeline = None, api_key: str = None):
        self.pipeline = pipeline or CVEmbeddingPipeline()
        self.llm = ChatGroq(model=model, api_key=api_key or os.environ["GROQ_API_KEY"])
        self.chain = PROMPT | self.llm | StrOutputParser()

    def ask(self, question: str, k: int = 4) -> str:
        chunks = self.pipeline.search(question, k=k)
        context = "\n\n".join(chunk.page_content for chunk in chunks)
        return self.chain.invoke({"context": context, "question": question})
