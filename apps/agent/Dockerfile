# Fluent voice-agent worker — production image (LiveKit Cloud agent hosting, Fly.io, Railway, any Docker host).
# Build from the REPO ROOT so the shared fixtures are available:  docker build -f apps/agent/Dockerfile -t fluent-agent .
FROM python:3.12-slim-bookworm AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PROJECT_ENVIRONMENT=/opt/venv \
    LOG_FORMAT=json

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl && rm -rf /var/lib/apt/lists/*
COPY --from=ghcr.io/astral-sh/uv:0.11 /uv /usr/local/bin/uv

WORKDIR /app
COPY apps/agent/pyproject.toml apps/agent/uv.lock ./apps/agent/
RUN cd apps/agent && uv sync --frozen --no-dev --no-install-project

COPY packages/shared/fixtures ./packages/shared/fixtures
COPY apps/agent ./apps/agent
RUN cd apps/agent && uv sync --frozen --no-dev

# Pre-download model weights (Silero VAD ships with the plugin; the turn detector mini model is fetched here)
# so the first session after a cold start does not pay for the download.
RUN cd apps/agent && /opt/venv/bin/python -c "from livekit.plugins import silero; silero.VAD.load()" \
 && (cd apps/agent && /opt/venv/bin/python agent.py download-files || true)

# Non-root runtime user
RUN useradd -m -u 10001 agent && chown -R agent:agent /app /opt/venv
USER agent
WORKDIR /app/apps/agent
ENV PATH="/opt/venv/bin:$PATH"

# 8081 is the worker's health/metrics HTTP port in production mode
EXPOSE 8081
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s CMD curl -fsS http://localhost:8081/ || exit 1

# `start` = production mode: prewarmed processes, load reporting, graceful drain on SIGTERM
CMD ["python", "agent.py", "start"]
