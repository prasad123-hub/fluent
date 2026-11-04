"""Provider factories (STT / LLM / TTS / VAD / turn detection) driven by settings.

Every constructor signature here was verified against livekit-agents 1.8.10 source
(see docs/RESEARCH_NOTES.md §1 "Plugins").
"""

from __future__ import annotations

import os
from typing import Any, Literal

from livekit.agents import inference, llm, stt, tts, vad
from livekit.plugins import anthropic, cartesia, deepgram, elevenlabs, openai, silero

from .log import get_logger
from .settings import Settings

log = get_logger("providers")

# Voice presets exposed in the UI (packages/shared/src/constants.ts VOICES).
# Cartesia/ElevenLabs voice ids can be overridden per preset with env vars
# FLUENT_VOICE_<PRESET>_CARTESIA / FLUENT_VOICE_<PRESET>_ELEVENLABS, because the
# provider voice libraries could not be fetched offline (see docs/DECISIONS.md).
VOICE_PRESETS: dict[str, dict[str, str]] = {
    "priya": {
        "cartesia": "f786b574-daa5-4673-aa0c-cbe3e8534c02",
        "elevenlabs": elevenlabs.tts.DEFAULT_VOICE_ID,
        "openai": "nova",
        "label": "Priya",
    },
    "arjun": {
        "cartesia": "f786b574-daa5-4673-aa0c-cbe3e8534c02",
        "elevenlabs": elevenlabs.tts.DEFAULT_VOICE_ID,
        "openai": "onyx",
        "label": "Arjun",
    },
    "katie": {
        "cartesia": "f786b574-daa5-4673-aa0c-cbe3e8534c02",
        "elevenlabs": elevenlabs.tts.DEFAULT_VOICE_ID,
        "openai": "shimmer",
        "label": "Katie",
    },
    "oliver": {
        "cartesia": "f786b574-daa5-4673-aa0c-cbe3e8534c02",
        "elevenlabs": elevenlabs.tts.DEFAULT_VOICE_ID,
        "openai": "fable",
        "label": "Oliver",
    },
    "maya": {
        "cartesia": "f786b574-daa5-4673-aa0c-cbe3e8534c02",
        "elevenlabs": elevenlabs.tts.DEFAULT_VOICE_ID,
        "openai": "alloy",
        "label": "Maya",
    },
    "sam": {
        "cartesia": "f786b574-daa5-4673-aa0c-cbe3e8534c02",
        "elevenlabs": elevenlabs.tts.DEFAULT_VOICE_ID,
        "openai": "echo",
        "label": "Sam",
    },
}

CartesiaSpeed = Literal["fastest", "fast", "normal", "slow", "slowest"]
CARTESIA_SPEEDS: dict[float, CartesiaSpeed] = {
    0.8: "slow",
    0.9: "slow",
    1.0: "normal",
    1.1: "fast",
    1.2: "fast",
    1.3: "fastest",
}


def cartesia_speed(speed: float) -> CartesiaSpeed:
    return CARTESIA_SPEEDS.get(round(speed, 1), "normal")


def voice_id(preset: str, provider: str) -> str:
    p = VOICE_PRESETS.get(preset) or VOICE_PRESETS["priya"]
    override = os.environ.get(f"FLUENT_VOICE_{preset.upper()}_{provider.upper()}")
    return override or p[provider]


def make_stt(s: Settings) -> stt.STT:
    if s.stt_provider == "openai" or (
        s.stt_provider == "deepgram" and not s.deepgram_api_key and s.openai_api_key
    ):
        log.info("stt.provider", provider="openai")
        return openai.STT(model="gpt-4o-transcribe", language="en")
    log.info("stt.provider", provider="deepgram", model="nova-3")
    return deepgram.STT(
        model="nova-3",
        language="en-IN",
        interim_results=True,
        punctuate=True,
        smart_format=False,
        filler_words=True,  # keep um/uh so fluency metrics can count them
        endpointing_ms=25,
        api_key=s.deepgram_api_key or None,  # type: ignore[arg-type]
    )


def make_llm(s: Settings, *, temperature: float = 0.6) -> llm.LLM:
    if s.fake_llm:
        from .fake_llm import ScriptedLLM

        log.warning(
            "llm.provider", provider="fake", note="FLUENT_FAKE_LLM=1 — scripted replies only"
        )
        return ScriptedLLM()
    if s.llm_provider == "anthropic":
        return anthropic.LLM(model=s.llm_model, temperature=temperature, max_tokens=400)
    return openai.LLM(model=s.llm_model, temperature=temperature, parallel_tool_calls=True)


def make_tts(s: Settings, *, voice: str, speed: float) -> tts.TTS:
    provider = s.tts_provider
    if provider == "cartesia" and not s.cartesia_api_key:
        provider = (
            "openai" if s.openai_api_key else ("elevenlabs" if s.elevenlabs_api_key else "cartesia")
        )
    if provider == "elevenlabs":
        return elevenlabs.TTS(
            voice_id=voice_id(voice, "elevenlabs"), model="eleven_turbo_v2_5", language="en"
        )
    if provider == "openai":
        return openai.TTS(model="gpt-4o-mini-tts", voice=voice_id(voice, "openai"), speed=speed)
    return cartesia.TTS(
        model="sonic-3",
        language="en",
        voice=voice_id(voice, "cartesia"),
        speed=cartesia_speed(speed),
    )


def apply_tts_speed(engine: tts.TTS, speed: float) -> bool:
    """Change speed on a running TTS where the plugin supports it. Returns True on success."""
    try:
        if isinstance(engine, cartesia.TTS):
            engine.update_options(speed=cartesia_speed(speed))
            return True
        if isinstance(engine, openai.TTS):
            engine.update_options(speed=speed)
            return True
    except Exception as e:  # noqa: BLE001
        log.warning("tts.speed_update_failed", error=str(e))
    return False


def apply_tts_voice(engine: tts.TTS, preset: str) -> bool:
    try:
        if isinstance(engine, cartesia.TTS):
            engine.update_options(voice=voice_id(preset, "cartesia"))
            return True
        if isinstance(engine, elevenlabs.TTS):
            engine.update_options(voice_id=voice_id(preset, "elevenlabs"))
            return True
        if isinstance(engine, openai.TTS):
            engine.update_options(voice=voice_id(preset, "openai"))
            return True
    except Exception as e:  # noqa: BLE001
        log.warning("tts.voice_update_failed", error=str(e))
    return False


def load_vad() -> vad.VAD:
    return silero.VAD.load(
        min_speech_duration=0.05, min_silence_duration=0.5, prefix_padding_duration=0.4
    )


def make_turn_detection() -> Any:
    """`inference.TurnDetector` (v1-mini runs locally; v1 uses LiveKit Cloud with local fallback).
    FLUENT_TURN_DETECTOR=vad|stt switches to simpler modes (useful offline)."""
    mode = os.environ.get("FLUENT_TURN_DETECTOR", "model")
    if mode in ("vad", "stt", "manual"):
        return mode
    return inference.TurnDetector()
