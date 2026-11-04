"""Environment-driven settings for the Fluent agent worker (validated at boot)."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from pydantic import BaseModel, Field, ValidationError

# Load `.env` from the repo root (monorepo) or the agent directory, whichever exists.
for candidate in (Path(__file__).resolve().parents[3] / ".env", Path.cwd() / ".env"):
    if candidate.exists():
        load_dotenv(candidate, override=False)
        break


class Settings(BaseModel):
    database_url: str = Field(alias="DATABASE_URL")
    livekit_url: str = Field(alias="LIVEKIT_URL")
    livekit_api_key: str = Field(alias="LIVEKIT_API_KEY")
    livekit_api_secret: str = Field(alias="LIVEKIT_API_SECRET")
    agent_name: str = Field(default="fluent-agent", alias="LIVEKIT_AGENT_NAME")

    llm_provider: Literal["openai", "anthropic"] = Field(
        default="openai", alias="FLUENT_LLM_PROVIDER"
    )
    llm_model: str = Field(default="gpt-4.1", alias="FLUENT_LLM_MODEL")
    analysis_model: str = Field(default="gpt-4.1", alias="FLUENT_ANALYSIS_MODEL")
    tts_provider: Literal["cartesia", "elevenlabs", "openai"] = Field(
        default="cartesia", alias="FLUENT_TTS_PROVIDER"
    )
    stt_provider: Literal["deepgram", "openai"] = Field(
        default="deepgram", alias="FLUENT_STT_PROVIDER"
    )
    fake_llm: bool = Field(default=False, alias="FLUENT_FAKE_LLM")

    openai_api_key: str | None = Field(default=None, alias="OPENAI_API_KEY")
    anthropic_api_key: str | None = Field(default=None, alias="ANTHROPIC_API_KEY")
    deepgram_api_key: str | None = Field(default=None, alias="DEEPGRAM_API_KEY")
    cartesia_api_key: str | None = Field(default=None, alias="CARTESIA_API_KEY")
    elevenlabs_api_key: str | None = Field(default=None, alias="ELEVENLABS_API_KEY")

    max_session_minutes: int = Field(default=30, alias="FLUENT_MAX_SESSION_MINUTES")
    max_daily_minutes: int = Field(default=120, alias="FLUENT_MAX_DAILY_MINUTES")
    log_level: str = Field(default="info", alias="LOG_LEVEL")

    model_config = {"populate_by_name": True, "extra": "ignore"}

    @property
    def analysis_provider(self) -> Literal["openai", "anthropic"]:
        return self.llm_provider


def _truthy(v: str | None) -> bool:
    return (v or "").strip().lower() in {"1", "true", "yes", "on"}


def load_settings(environ: dict[str, str] | None = None) -> Settings:
    env = dict(os.environ if environ is None else environ)
    env["FLUENT_FAKE_LLM"] = "1" if _truthy(env.get("FLUENT_FAKE_LLM")) else "0"
    try:
        return Settings.model_validate(env)
    except ValidationError as e:  # pragma: no cover - exercised manually
        missing = ", ".join(str(err["loc"][0]) for err in e.errors())
        raise SystemExit(
            f"\n✖ Invalid agent environment. Copy .env.example to .env and set: {missing}\n"
        ) from None


_settings: Settings | None = None


def settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = load_settings()
    return _settings
