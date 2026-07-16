FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential curl \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir uv

# Copy dependency trước để tận dụng Docker layer cache.
COPY pyproject.toml uv.lock README.md ./

# Cài dependency ứng dụng.
RUN uv sync --locked --no-dev --no-install-project

# Copy code sau cùng để thay đổi source không làm mất cache dependency.
COPY src ./src
COPY config ./config
COPY scripts ./scripts
COPY main.py ./main.py

RUN uv sync --locked --no-dev

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
