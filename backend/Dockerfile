FROM python:3.13-slim

WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy dependency manifest first for layer caching
COPY pyproject.toml .

# Install dependencies (no venv inside container, install to system)
RUN uv pip install --system --no-cache -r pyproject.toml 2>/dev/null || \
    uv pip install --system --no-cache \
        "huggingface-hub>=1.16.1" \
        "langchain>=1.3.1" \
        "langchain-community>=0.4.1" \
        "langchain-core>=1.4.0" \
        "langchain-groq>=1.1.2" \
        "pymupdf>=1.27.2.3" \
        "pypdf>=6.12.1" \
        "python-dotenv>=1.2.2" \
        "sentence-transformers>=5.5.1" \
        "supabase>=2.30.0" \
        "fastapi>=0.115.0" \
        "uvicorn[standard]>=0.34.0" \
        "python-multipart>=0.0.20"

# Pre-download the embedding model so cold starts are instant
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Copy application code
COPY app/ app/
COPY main.py .

EXPOSE 8000

CMD ["uvicorn", "app.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
