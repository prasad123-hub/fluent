"""End-of-session analysis pipeline. TODO(phase-8): deterministic metrics + LLM rubric + report persistence."""

from __future__ import annotations

from ..db import Database
from ..log import get_logger
from ..settings import Settings

log = get_logger("analysis")


async def analyze_session(db: Database, session_id: str, s: Settings) -> None:
    log.info(
        "analysis.todo",
        session_id=session_id,
        note="pipeline arrives in phase 8; session stays 'analyzing'",
    )
