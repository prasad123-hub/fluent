"""Incremental persistence of everything that happens in a session (utterances, words, events, latency)."""

from __future__ import annotations

import asyncio
import time
from collections.abc import Awaitable, Callable
from typing import Any

from livekit.agents import llm, metrics
from livekit.agents.types import NOT_GIVEN
from livekit.agents.voice.events import (
    ConversationItemAddedEvent,
    FunctionToolsExecutedEvent,
    MetricsCollectedEvent,
)
from livekit.agents.voice.io import TimedString

from .db import Database
from .log import get_logger

log = get_logger("tracker")

FILLERS = {
    "um",
    "uh",
    "umm",
    "uhh",
    "hmm",
    "er",
    "erm",
    "ah",
    "like",
    "basically",
    "actually",
    "literally",
    "you know",
    "i mean",
    "kind of",
    "sort of",
    "right",
    "okay so",
    "so",
    "only",
    "itself",
    "na",
    "means",
    "the thing is",
}

LATENCY_KEYS = {
    "transcription_delay",
    "end_of_turn_delay",
    "on_user_turn_completed_delay",
    "llm_node_ttft",
    "llm_node_ttfs",
    "tts_node_ttfb",
    "e2e_latency",
    "playback_latency",
}


def latency_ms(m: dict[str, Any]) -> dict[str, int]:
    return {
        k: round(v * 1000) for k, v in m.items() if k in LATENCY_KEYS and isinstance(v, int | float)
    }


class Store:
    """Write sink. `Database` in production; `NullStore` for key-free local runs without Postgres."""

    async def insert_utterance(
        self, session_id: str, **kw: Any
    ) -> str:  # pragma: no cover - interface
        raise NotImplementedError

    async def insert_event(
        self, session_id: str, *, type_: str, at_ms: int, payload: dict[str, Any]
    ) -> None:
        raise NotImplementedError

    async def insert_usage(self, session_id: str | None, **kw: Any) -> None:
        raise NotImplementedError


class NullStore(Store):
    def __init__(self) -> None:
        self.utterances: list[dict[str, Any]] = []
        self.events: list[dict[str, Any]] = []

    async def insert_utterance(self, session_id: str, **kw: Any) -> str:
        self.utterances.append({"sessionId": session_id, **kw})
        log.info(
            "utterance",
            speaker=kw.get("speaker"),
            text=(kw.get("text") or "")[:80],
            words=len(kw.get("words") or []),
        )
        return f"u{len(self.utterances)}"

    async def insert_event(
        self, session_id: str, *, type_: str, at_ms: int, payload: dict[str, Any]
    ) -> None:
        self.events.append(
            {"sessionId": session_id, "type": type_, "atMs": at_ms, "payload": payload}
        )
        log.info("event", type=type_, at_ms=at_ms, payload=payload)

    async def insert_usage(self, session_id: str | None, **kw: Any) -> None:
        log.info("usage", **kw)


class DbStore(Store):
    def __init__(self, db: Database) -> None:
        self.db = db

    async def insert_utterance(self, session_id: str, **kw: Any) -> str:
        return await self.db.insert_utterance(session_id, **kw)

    async def insert_event(
        self, session_id: str, *, type_: str, at_ms: int, payload: dict[str, Any]
    ) -> None:
        await self.db.insert_event(session_id, type_=type_, at_ms=at_ms, payload=payload)

    async def insert_usage(self, session_id: str | None, **kw: Any) -> None:
        await self.db.insert_usage(session_id, **kw)


def _opt_float(v: Any) -> float | None:
    if v is NOT_GIVEN or v is None:
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def word_dict(w: TimedString, t0: float) -> dict[str, Any]:
    start = _opt_float(w.start_time)
    end = _opt_float(w.end_time)
    conf = _opt_float(w.confidence)
    text = str(w)
    return {
        "w": text,
        "start": int(start * 1000) if start is not None else None,
        "end": int(end * 1000) if end is not None else None,
        "conf": conf,
        "filler": text.lower().strip(".,!?") in FILLERS,
    }


def count_fillers(text: str) -> int:
    low = " " + text.lower().replace(",", " ").replace(".", " ") + " "
    n = 0
    for f in FILLERS:
        n += low.count(f" {f} ")
    return n


class SessionTracker:
    """Serialises writes through a queue so event handlers never block the audio pipeline."""

    def __init__(self, store: Store, session_id: str) -> None:
        self.store = store
        self.session_id = session_id
        self.t0 = time.time()  # session clock origin (wall)
        self.seq = 0
        self.current_character: str | None = None
        self.hints_used = 0
        self.corrections = 0
        self._pending_words: list[dict[str, Any]] = []
        self._pending_conf: list[float] = []
        self._latency: dict[str, float] = {}
        self._queue: asyncio.Queue[Callable[[], Awaitable[None]] | None] = asyncio.Queue()
        self._worker: asyncio.Task[None] | None = None
        self.usage_totals: dict[str, float] = {
            "llm_in": 0,
            "llm_out": 0,
            "tts_chars": 0,
            "stt_sec": 0,
        }

    # ── lifecycle ──────────────────────────────────────────────────────────
    def start(self) -> None:
        self._worker = asyncio.create_task(self._run(), name="tracker-writer")

    async def close(self) -> None:
        await self._queue.put(None)
        if self._worker:
            try:
                await asyncio.wait_for(self._worker, timeout=10)
            except TimeoutError:
                log.warning("tracker.flush_timeout")

    async def _run(self) -> None:
        while True:
            fn = await self._queue.get()
            if fn is None:
                return
            try:
                await fn()
            except Exception as e:  # noqa: BLE001
                log.warning("tracker.write_failed", error=str(e))

    def submit(self, fn: Callable[[], Awaitable[None]]) -> None:
        self._queue.put_nowait(fn)

    def now_ms(self) -> int:
        return int((time.time() - self.t0) * 1000)

    # ── STT words (from Agent.stt_node override) ──────────────────────────
    def add_final_words(self, words: list[TimedString] | None, confidence: float) -> None:
        if words:
            self._pending_words.extend(word_dict(w, self.t0) for w in words)
        self._pending_conf.append(confidence)

    # ── events from AgentSession ──────────────────────────────────────────
    def on_item_added(self, ev: ConversationItemAddedEvent) -> None:
        item = ev.item
        if item.type != "message":
            if item.type == "agent_handoff":
                self.event("persona_switch", {"to": item.new_agent_id})
            return
        msg: llm.ChatMessage = item
        text = msg.text_content or ""
        if not text.strip():
            return
        self.seq += 1
        seq = self.seq
        at = self.now_ms()
        if msg.role == "user":
            words = self._pending_words
            self._pending_words = []
            confs = self._pending_conf
            self._pending_conf = []
            start = min((w["start"] for w in words if w["start"] is not None), default=None)
            end = max((w["end"] for w in words if w["end"] is not None), default=None)
            m = dict(msg.metrics)
            created = int((msg.created_at - self.t0) * 1000)
            start_ms = (
                start
                if start is not None
                else max(0, created - int(len(text.split()) / 2.5 * 1000))
            )
            end_ms = end if end is not None else created
            conf = (sum(confs) / len(confs)) if confs else (msg.transcript_confidence or None)
            fillers = sum(1 for w in words if w["filler"]) if words else count_fillers(text)
            payload = dict(
                seq=seq,
                speaker="human",
                text=text,
                start_ms=start_ms,
                end_ms=end_ms,
                words=words or None,
                confidence=conf,
                filler_count=fillers,
                interrupted=False,
                metrics={k: round(v * 1000) for k, v in m.items() if isinstance(v, int | float)}
                or None,
            )
        else:
            m = dict(msg.metrics)
            lat = latency_ms(m)
            created = int((msg.created_at - self.t0) * 1000)
            est_dur = int(len(text.split()) / 2.6 * 1000)
            payload = dict(
                seq=seq,
                speaker="agent",
                text=text,
                start_ms=created,
                end_ms=created + est_dur,
                words=None,
                confidence=None,
                filler_count=0,
                interrupted=msg.interrupted,
                agent_character=self.current_character,
                metrics=lat or None,
            )
            if lat:
                self.event("latency", {"turn": seq, **lat}, at)
            if msg.interrupted:
                self.event("interruption", {"by": "user", "turn": seq}, at)

        async def _write() -> None:
            await self.store.insert_utterance(self.session_id, **payload)

        self.submit(_write)

    def on_tools_executed(self, ev: FunctionToolsExecutedEvent) -> None:
        for call, out in ev.zipped():
            self.event(
                "tool_call",
                {
                    "name": call.name,
                    "arguments": call.arguments,
                    "output": (out.output or "")[:500],
                    "error": bool(out.is_error),
                },
            )

    def on_metrics(self, ev: MetricsCollectedEvent) -> None:
        m = ev.metrics
        if isinstance(m, metrics.LLMMetrics):
            self.usage_totals["llm_in"] += m.prompt_tokens
            self.usage_totals["llm_out"] += m.completion_tokens
        elif isinstance(m, metrics.TTSMetrics):
            self.usage_totals["tts_chars"] += m.characters_count
        elif isinstance(m, metrics.STTMetrics):
            self.usage_totals["stt_sec"] += m.audio_duration

    def event(self, type_: str, payload: dict[str, Any], at_ms: int | None = None) -> None:
        at = self.now_ms() if at_ms is None else at_ms
        if type_ == "hint":
            self.hints_used += 1
        if type_ == "correction":
            self.corrections += 1

        async def _write() -> None:
            await self.store.insert_event(self.session_id, type_=type_, at_ms=at, payload=payload)

        self.submit(_write)

    async def flush_usage(self, llm_model: str, provider: str) -> None:
        t = self.usage_totals
        if t["llm_in"] or t["llm_out"]:
            await self.store.insert_usage(
                self.session_id,
                provider=provider,
                kind="llm",
                model=llm_model,
                input_tokens=int(t["llm_in"]),
                output_tokens=int(t["llm_out"]),
                cost_usd=round(t["llm_in"] / 1e6 * 2.0 + t["llm_out"] / 1e6 * 8.0, 5),
            )
        if t["tts_chars"]:
            await self.store.insert_usage(
                self.session_id,
                provider="tts",
                kind="tts",
                model=None,
                characters=int(t["tts_chars"]),
                cost_usd=round(t["tts_chars"] / 1e6 * 30.0, 5),
            )
        if t["stt_sec"]:
            await self.store.insert_usage(
                self.session_id,
                provider="stt",
                kind="stt",
                model=None,
                audio_seconds=round(t["stt_sec"], 1),
                cost_usd=round(t["stt_sec"] / 60 * 0.0077, 5),
            )
