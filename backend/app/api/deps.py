from functools import lru_cache


@lru_cache(maxsize=1)
def get_cv_pipeline():
    from app.embeddings.cv_embeddings import CVEmbeddingPipeline
    return CVEmbeddingPipeline()


@lru_cache(maxsize=1)
def get_cv_copilot():
    from app.rag.cv_rag import CVCopilot
    return CVCopilot(pipeline=get_cv_pipeline())


@lru_cache(maxsize=1)
def get_job_rag():
    from app.embeddings.job_embeddings import JobEmbeddingPipeline
    from app.rag.job_rag import JobDescriptionRAG
    return JobDescriptionRAG(
        cv_pipeline=get_cv_pipeline(),
        job_pipeline=JobEmbeddingPipeline(),
    )
