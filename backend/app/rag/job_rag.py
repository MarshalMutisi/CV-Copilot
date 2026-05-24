import os
from pathlib import Path

from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from app.embeddings.cv_embeddings import CVEmbeddingPipeline
from app.embeddings.job_embeddings import JobEmbeddingPipeline

load_dotenv(Path(__file__).parent.parent.parent / ".env")

FIT_PROMPT = ChatPromptTemplate.from_template("""
You are an expert career coach analyzing how well a candidate's CV matches a job description.

Relevant CV sections:
{cv_context}

Key job requirements:
{jd_context}

Provide:
1. Overall match score (0-100%) with a one-line summary
2. Strengths — where the CV clearly aligns with the role
3. Verdict — should the candidate apply, and why?
""")

GAPS_PROMPT = ChatPromptTemplate.from_template("""
You are an expert career coach identifying gaps between a candidate's CV and a job description.

Relevant CV sections:
{cv_context}

Key job requirements:
{jd_context}

List every requirement or skill from the job description that is missing or insufficiently
demonstrated in the CV. For each gap:
- State the missing requirement
- Rate its importance to the role (High / Medium / Low)
- Suggest how the candidate could address it (training, projects, certifications, etc.)
""")

COVER_LETTER_PROMPT = ChatPromptTemplate.from_template("""
You are an expert career coach writing a cover letter.

Relevant CV sections:
{cv_context}

Key job requirements:
{jd_context}

Write a concise, compelling cover letter (3-4 paragraphs) tailored to this role.
Professional but personable tone. Do not fabricate experience not in the CV.
""")


class JobDescriptionRAG:
    def __init__(
        self,
        model: str = "llama-3.3-70b-versatile",
        cv_pipeline: CVEmbeddingPipeline = None,
        job_pipeline: JobEmbeddingPipeline = None,
        api_key: str = None,
    ):
        self.cv_pipeline = cv_pipeline or CVEmbeddingPipeline()
        self.job_pipeline = job_pipeline or JobEmbeddingPipeline()
        self.llm = ChatGroq(model=model, api_key=api_key or os.environ["GROQ_API_KEY"])
        self._job_description: str = ""

    def ingest(self, source: str, title: str = "", company: str = "") -> None:
        # Store the raw text directly — no vector store, so previous jobs never bleed in.
        self._job_description = source

    def _get_context(self, query: str, k: int = 5) -> tuple[str, str]:
        cv_chunks = self.cv_pipeline.search(query, k=k)
        return (
            "\n\n".join(c.page_content for c in cv_chunks),
            self._job_description,
        )

    def _run(self, prompt: ChatPromptTemplate, query: str) -> str:
        cv_context, jd_context = self._get_context(query)
        chain = prompt | self.llm | StrOutputParser()
        return chain.invoke({"cv_context": cv_context, "jd_context": jd_context})

    def analyze_fit(self) -> str:
        return self._run(FIT_PROMPT, "required skills experience qualifications responsibilities")

    def find_gaps(self) -> str:
        return self._run(GAPS_PROMPT, "required skills qualifications certifications technologies")

    def write_cover_letter(self) -> str:
        return self._run(COVER_LETTER_PROMPT, "role responsibilities company values mission")
