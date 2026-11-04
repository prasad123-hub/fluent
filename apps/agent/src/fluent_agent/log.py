"""structlog configuration. Every log line carries the session id once bound."""

from __future__ import annotations

import logging
import os
import sys

import structlog


def configure_logging(level: str | None = None) -> None:
    lvl = getattr(logging, (level or os.environ.get("LOG_LEVEL") or "info").upper(), logging.INFO)
    logging.basicConfig(format="%(message)s", stream=sys.stdout, level=lvl)
    pretty = sys.stdout.isatty() and os.environ.get("LOG_FORMAT", "") != "json"
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="%H:%M:%S" if pretty else "iso"),
            structlog.dev.ConsoleRenderer() if pretty else structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(lvl),
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str = "fluent") -> structlog.stdlib.BoundLogger:
    return structlog.get_logger(name)  # type: ignore[no-any-return]


def bind_session(session_id: str, **extra: object) -> None:
    structlog.contextvars.bind_contextvars(session_id=session_id, **extra)
