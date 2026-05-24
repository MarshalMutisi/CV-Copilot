# ── Stage 1: Build Next.js frontend ──────────────────────────────────────────
FROM node:22-alpine AS frontend
WORKDIR /frontend

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci

COPY frontend/ .

# NEXT_PUBLIC_API_URL is empty so the browser sends requests to the same origin
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_API_URL=""
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ── Stage 2: Python backend + embedded frontend ───────────────────────────────
FROM python:3.13-slim
WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

COPY backend/pyproject.toml .
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

# Pre-download embedding model so cold starts are instant
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

COPY backend/app/ app/
COPY backend/main.py .

# Embed the built frontend — FastAPI will serve this as static files
COPY --from=frontend /frontend/out/ static/

EXPOSE 8000
CMD ["python", "main.py"]
