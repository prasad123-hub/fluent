"""Fluent voice-agent worker: AgentServer entrypoint, FluentAgent (tools) and session control.

Every LiveKit API used here was verified against livekit-agents 1.8.10 (docs/RESEARCH_NOTES.md).
"""

from __future__ import annotations

import asyncio
import json
import time
from collections.abc import AsyncIterable, Coroutine
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from livekit import rtc
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    JobProcess,
    ModelSettings,
    RunContext,
    ToolError,
    cli,
    function_tool,
    room_io,
    stt,
)
from livekit.agents.voice.events import (
    AgentFalseInterruptionEvent,
    AgentStateChangedEvent,
    ConversationItemAddedEvent,
    FunctionToolsExecutedEvent,
    MetricsCollectedEvent,
    UserInputTranscribedEvent,
    UserStateChangedEvent,
)

from .db import Database
from .hinglish import detect_code_switch
from .log import bind_session, configure_logging, get_logger
from .prompt import build_instructions
from .providers import (
    apply_tts_speed,
    apply_tts_voice,
    load_vad,
    make_llm,
    make_stt,
    make_tts,
    make_turn_detection,
)
from .schemas import Persona, Scenario, SessionDispatchMetadata
from .settings import Settings, settings
from .tracker import DbStore, NullStore, SessionTracker, Store

log = get_logger("agent")

SILENCE_PROMPT_SEC = 6.0
SILENCE_HINT_SEC = 20.0
AWAY_END_SEC = 120.0
FIXTURE_SCENARIO = (
    Path(__file__).resolve().parents[3]
    / "packages"
    / "shared"
    / "fixtures"
    / "scenario.example.json"
)


# ───────────────────────────── config ─────────────────────────────


@dataclass
class SessionConfig:
    meta: SessionDispatchMetadata
    scenario: Scenario
    learner_name: str = "there"
    user_id: str | None = None
    profile: dict[str, Any] | None = None
    max_minutes: int = 30


@dataclass
class SessionControl:
    """Mutable per-session state owned by code (the model only proposes)."""

    cfg: SessionConfig
    tracker: SessionTracker
    ctx: JobContext | None
    started_at: float = field(default_factory=time.time)
    ending: bool = False
    end_reason: str | None = None
    last_agent_done: float = field(default_factory=time.time)
    last_user_activity: float = field(default_factory=time.time)
    silence_stage: int = 0  # 0 none, 1 prompted (6 s), 2 hinted (20 s)
    away_since: float | None = None
    warned_last_minute: bool = False
    drill_scores: list[int] = field(default_factory=list)
    interview_q: int = 0
    tasks: list[asyncio.Task[Any]] = field(default_factory=list)

    def spawn(self, coro: Coroutine[Any, Any, Any], name: str) -> None:
        t = asyncio.create_task(coro, name=name)
        self.tasks.append(t)
        t.add_done_callback(self.tasks.remove)


# ───────────────────────────── the agent ─────────────────────────────


class FluentAgent(Agent):
    def __init__(self, cfg: SessionConfig, ctl: SessionControl, *, tts: Any = None) -> None:
        instructions = build_instructions(
            scenario=cfg.scenario,
            learner_name=cfg.learner_name,
            difficulty=cfg.meta.difficulty,
            coaching_mode=cfg.meta.coachingMode,
            duration_min=cfg.meta.durationMin,
            profile=cfg.profile,
        )
        super().__init__(instructions=instructions, tts=tts if tts is not None else None)
        self.cfg = cfg
        self.ctl = ctl

    # ── lifecycle ──────────────────────────────────────────────────────
    async def on_enter(self) -> None:
        # The scripted opening line goes out via say() — no LLM round-trip, so the greeting lands fast.
        self.session.say(self.cfg.scenario.agentOpeningLine, allow_interruptions=True)

    async def on_user_turn_completed(self, turn_ctx: Any, new_message: Any) -> None:
        self.ctl.last_user_activity = time.time()
        self.ctl.silence_stage = 0
        text = new_message.text_content or ""
        hits = detect_code_switch(text)
        if hits:
            self.ctl.tracker.event(
                "code_switch",
                {
                    "text": text,
                    "words": [h[0] for h in hits],
                    "suggestions": [h[1] for h in hits],
                    "source": "lexicon",
                },
            )
            mode = self.cfg.meta.coachingMode
            if mode in ("gentle", "active"):
                turn_ctx.add_message(
                    role="system",
                    content=(
                        "The learner just used Hindi words: "
                        + ", ".join(f"'{h[0]}' (≈ '{h[1]}')" for h in hits)
                        + ". Gently offer the English phrasing once and invite them to say it in English, then continue."
                    ),
                )

    # ── STT tap for word-level timings ────────────────────────────────
    async def stt_node(
        self, audio: AsyncIterable[rtc.AudioFrame], model_settings: ModelSettings
    ) -> AsyncIterable[stt.SpeechEvent | str]:  # type: ignore[override]
        base = Agent.default.stt_node(self, audio, model_settings)
        stream = await base if asyncio.iscoroutine(base) else base
        if stream is None:
            return
        async for ev in stream:  # type: ignore[union-attr]
            if (
                isinstance(ev, stt.SpeechEvent)
                and ev.type == stt.SpeechEventType.FINAL_TRANSCRIPT
                and ev.alternatives
            ):
                alt = ev.alternatives[0]
                self.ctl.tracker.add_final_words(alt.words, alt.confidence)
                self.ctl.last_user_activity = time.time()
            yield ev

    # ── tools ─────────────────────────────────────────────────────────
    @function_tool
    async def give_hint(self, context: RunContext) -> str:
        """Give the learner a hint about what they could say next. Use ONLY when the learner asks for help
        ("help", "what should I say", "hint") or when you are told they are stuck. In strict/exam mode, refuse."""
        if self.cfg.meta.coachingMode == "strict":
            raise ToolError(
                "Hints are not available in exam mode. Tell the learner to try their best."
            )
        phrases = self.cfg.scenario.usefulPhrases
        idx = self.ctl.tracker.hints_used % max(1, len(phrases))
        phrase = (
            phrases[idx] if phrases else "Try answering with one clear sentence and one example."
        )
        self.ctl.tracker.event("hint", {"phrase": phrase, "requested": True})
        return f"hint: You could say something like: '{phrase}'. Suggest it briefly, then ask your question again."

    @function_tool
    async def log_correction(
        self, context: RunContext, original: str, corrected: str, category: str, explanation: str
    ) -> str:
        """Silently record a learner error you noticed. Call this for EVERY grammar, vocabulary or pronunciation error,
        in every coaching mode. Never mention the tool.

        Args:
            original: the learner's exact words
            corrected: the corrected version
            category: one of tense, article, preposition, subject_verb, word_order, plural, modal, conditional, other
            explanation: one short sentence on why
        """
        allowed = {
            "tense",
            "article",
            "preposition",
            "subject_verb",
            "word_order",
            "plural",
            "modal",
            "conditional",
            "other",
        }
        cat = category if category in allowed else "other"
        self.ctl.tracker.event(
            "correction",
            {
                "original": original,
                "corrected": corrected,
                "category": cat,
                "explanation": explanation,
            },
        )
        return "logged"

    @function_tool
    async def log_good_phrase(self, context: RunContext, phrase: str) -> str:
        """Record an impressive or well-formed phrase the learner used (for positive feedback in the report).

        Args:
            phrase: the learner's exact words
        """
        self.ctl.tracker.event("good_phrase", {"phrase": phrase})
        return "logged"

    @function_tool
    async def log_code_switch(self, context: RunContext, text: str, suggestion: str) -> str:
        """Record that the learner said something in Hindi/Hinglish instead of English.

        Args:
            text: the Hindi/Hinglish words used
            suggestion: the natural English equivalent
        """
        self.ctl.tracker.event(
            "code_switch", {"text": text, "suggestion": suggestion, "source": "llm"}
        )
        return "logged"

    @function_tool
    async def set_timer(self, context: RunContext, seconds: int, label: str) -> str:
        """Start a countdown for a timed task (e.g. 'speak for 60 seconds'). You will be told when it ends.

        Args:
            seconds: duration of the timer, 10–300
            label: what the timer is for
        """
        secs = max(10, min(300, int(seconds)))

        async def _fire() -> None:
            await asyncio.sleep(secs)
            if not self.ctl.ending:
                self.session.generate_reply(
                    instructions=f"The timer '{label}' ({secs} seconds) has just ended. Tell the learner time is up and continue."
                )

        self.ctl.spawn(_fire(), f"timer-{label}")
        self.ctl.tracker.event("system", {"timer": label, "seconds": secs})
        return f"timer started for {secs} seconds"

    @function_tool
    async def end_session_with_summary(self, context: RunContext, summary: str) -> str:
        """End the practice session. Call when the learner says they want to stop/end, or when you are told time is up.

        Args:
            summary: two sentences summarising what the learner practised and did well
        """
        self.ctl.tracker.event("system", {"end_summary": summary})
        request_end(self.ctl, self.session, "agent_ended")
        return "summary recorded. Say a warm one-sentence goodbye now; the session will close after you finish speaking."

    @function_tool
    async def change_tts_speed(self, context: RunContext, rate: float) -> str:
        """Change how fast you speak. Use when the learner asks you to slow down or speed up.

        Args:
            rate: 0.8 for slower, 1.0 normal, 1.2 faster
        """
        r = max(0.7, min(1.3, float(rate)))
        engine = self.session.tts
        ok = apply_tts_speed(engine, r) if engine is not None else False
        self.ctl.tracker.event("system", {"tts_speed": r, "applied": ok})
        return (
            f"speaking rate set to {r}"
            if ok
            else "this voice cannot change speed; speak in shorter, simpler sentences instead"
        )

    @function_tool
    async def next_interview_question(self, context: RunContext) -> str:
        """In interviews, move to the next question. Returns the question number and a topic to cover."""
        topics = [
            "tell me about yourself",
            "why this role and this company",
            "a challenge you faced and how you handled it (STAR)",
            "a time you disagreed with a manager",
            "your biggest strength and a weakness you're working on",
            "where you see yourself in three years",
            "questions the candidate has for us",
        ]
        self.ctl.interview_q += 1
        i = min(self.ctl.interview_q, len(topics)) - 1
        self.ctl.tracker.event(
            "system", {"interview_question": self.ctl.interview_q, "topic": topics[i]}
        )
        return f"question {self.ctl.interview_q} of {len(topics)}: {topics[i]}"

    @function_tool
    async def score_drill_attempt(self, context: RunContext, score: int, feedback: str) -> str:
        """In drills, score the learner's latest attempt from 1 to 10 with one line of feedback.

        Args:
            score: 1–10
            feedback: one short, specific, encouraging line
        """
        sc = max(1, min(10, int(score)))
        self.ctl.drill_scores.append(sc)
        self.ctl.tracker.event(
            "drill_score",
            {"score": sc, "feedback": feedback, "attempt": len(self.ctl.drill_scores)},
        )
        avg = sum(self.ctl.drill_scores) / len(self.ctl.drill_scores)
        return f"recorded {sc}/10 (attempt {len(self.ctl.drill_scores)}, running average {avg:.1f})"

    @function_tool
    async def lookup_word(self, context: RunContext, word: str) -> str:
        """Look up a word the learner asked about. Returns guidance for a short spoken definition.

        Args:
            word: the word to define
        """
        self.ctl.tracker.event("system", {"lookup_word": word})
        # No offline dictionary is bundled; the model supplies the definition from the guidance below.
        return f"No dictionary entry stored. Define '{word}' in one simple sentence, say how it is pronounced in plain words, and give one example sentence."

    @function_tool
    async def switch_persona(self, context: RunContext, name: str) -> str:
        """In multi-character scenarios (panel interviews, group discussions), switch to speaking as another character.
        Call it right before you speak as that character.

        Args:
            name: the character's name exactly as listed
        """
        chars = self.cfg.scenario.characters or []
        match = next(
            (c for c in chars if c.name.lower() == name.lower() or name.lower() in c.name.lower()),
            None,
        )
        if match is None:
            raise ToolError(
                f"Unknown character '{name}'. Available: {', '.join(c.name for c in chars) or 'none'}"
            )
        self.ctl.tracker.current_character = match.name
        engine = self.session.tts
        applied = apply_tts_voice(engine, match.voice) if engine is not None else False
        self.ctl.tracker.event(
            "persona_switch", {"to": match.name, "voice": match.voice, "applied": applied}
        )
        return f"now speaking as {match.name} ({match.role}). Announce the speaker by name."


# ───────────────────────────── session control ─────────────────────────────


def request_end(ctl: SessionControl, session: AgentSession, reason: str) -> None:
    if ctl.ending:
        return
    ctl.ending = True
    ctl.end_reason = reason
    log.info("session.end_requested", reason=reason)

    async def _close() -> None:
        try:
            await asyncio.sleep(1.5)  # let the goodbye get scheduled
            await asyncio.wait_for(session.wait_for_idle(), timeout=20)
        except Exception:  # noqa: BLE001
            pass
        if ctl.ctx is not None:
            ctl.ctx.shutdown(reason=reason)
        else:
            await session.aclose()

    ctl.spawn(_close(), "close-session")


async def watchdog(ctl: SessionControl, session: AgentSession) -> None:
    """Silence prompts, session timer and inactivity end — code owns timing, the model owns wording."""
    cfg = ctl.cfg
    limit_sec = min(cfg.meta.durationMin or cfg.max_minutes, cfg.max_minutes) * 60
    while not ctl.ending:
        await asyncio.sleep(1.0)
        now = time.time()
        elapsed = now - ctl.started_at

        # Session length
        if limit_sec - elapsed <= 60 and not ctl.warned_last_minute:
            ctl.warned_last_minute = True
            session.generate_reply(
                instructions="About one minute is left. Naturally start wrapping up: ask one final short question or invite closing thoughts."
            )
            continue
        if elapsed >= limit_sec:
            session.generate_reply(
                instructions="Time is up. Thank the learner warmly in one sentence and say goodbye."
            )
            request_end(ctl, session, "timer")
            break

        # Inactivity (user went away)
        if session.user_state == "away":
            ctl.away_since = ctl.away_since or now
            if now - ctl.away_since > AWAY_END_SEC:
                request_end(ctl, session, "inactive")
                break
        else:
            ctl.away_since = None

        # Silence while the agent is listening
        if session.agent_state == "listening" and session.user_state == "listening":
            quiet_for = now - max(ctl.last_agent_done, ctl.last_user_activity)
            if quiet_for > SILENCE_HINT_SEC and ctl.silence_stage < 2:
                ctl.silence_stage = 2
                ctl.tracker.event("silence", {"seconds": round(quiet_for), "stage": "hint"})
                if cfg.meta.coachingMode == "strict":
                    session.generate_reply(
                        instructions="The candidate has been silent for 20 seconds. Repeat the question once, more simply, and wait."
                    )
                else:
                    session.generate_reply(
                        instructions="The learner has been silent for about 20 seconds and seems stuck. Call give_hint, then offer the hint kindly and simplify your question."
                    )
            elif quiet_for > SILENCE_PROMPT_SEC and ctl.silence_stage < 1:
                ctl.silence_stage = 1
                ctl.tracker.event("silence", {"seconds": round(quiet_for), "stage": "prompt"})
                session.generate_reply(
                    instructions="The learner has been silent for a few seconds. Gently offer a prompt or rephrase your last question in simpler words. One short sentence."
                )


# ───────────────────────────── config loading ─────────────────────────────


def parse_metadata(ctx: JobContext | None) -> SessionDispatchMetadata | None:
    raw = ""
    if ctx is not None:
        raw = ctx.job.metadata or ""
        if not raw and ctx.room is not None:
            raw = ctx.room.metadata or ""
    if not raw:
        return None
    try:
        return SessionDispatchMetadata.model_validate(json.loads(raw))
    except Exception as e:  # noqa: BLE001
        log.warning("metadata.invalid", error=str(e), raw=raw[:200])
        return None


def scenario_from_row(row: dict[str, Any]) -> Scenario:
    def j(v: Any) -> Any:
        return json.loads(v) if isinstance(v, str) else v

    return Scenario(
        id=row["id"],
        themeId=row["themeId"],
        title=row["title"],
        description=row["description"],
        difficulty=row["difficulty"],
        mode=row["mode"],
        agentPersona=Persona(
            name=row["personaName"],
            role=row["personaRole"],
            personality=row["personaPersonality"],
            accent=row["personaAccent"],
        ),
        agentOpeningLine=row["agentOpeningLine"],
        learnerGoal=row["learnerGoal"],
        successCriteria=j(row["successCriteria"]),
        keyVocabulary=j(row["keyVocabulary"]),
        usefulPhrases=j(row["usefulPhrases"]),
        commonMistakesToWatch=j(row["commonMistakesToWatch"]),
        suggestedDurationMin=row["suggestedDurationMin"],
        systemPromptTemplate=row["systemPromptTemplate"],
        characters=j(row.get("characters")) if row.get("characters") else None,
        tags=j(row.get("tags")) if row.get("tags") else None,
    )


def fixture_scenario() -> Scenario:
    return Scenario.model_validate(json.loads(FIXTURE_SCENARIO.read_text()))


async def load_config(
    db: Database | None, meta: SessionDispatchMetadata | None, s: Settings
) -> SessionConfig:
    """Resolve scenario + learner from the DB. Falls back to the bundled fixture for local debugging."""
    if meta is None:
        import os

        meta = SessionDispatchMetadata(
            sessionId=os.environ.get("FLUENT_DEBUG_SESSION_ID", "debug-session"),
            scenarioId=os.environ.get("FLUENT_DEBUG_SCENARIO", "interview-hr-screening"),
            coachingMode=os.environ.get("FLUENT_DEBUG_MODE", "gentle"),  # type: ignore[arg-type]
            difficulty=os.environ.get("FLUENT_DEBUG_DIFFICULTY", "B1"),  # type: ignore[arg-type]
            durationMin=None,
        )
        log.warning(
            "metadata.missing", note="using FLUENT_DEBUG_* defaults (debugger/console mode)"
        )

    scenario: Scenario | None = meta.customScenario
    learner = "there"
    user_id: str | None = None
    profile: dict[str, Any] | None = None

    if db is not None:
        try:
            if scenario is None and meta.scenarioId:
                row = await db.get_scenario(meta.scenarioId)
                if row:
                    scenario = scenario_from_row(row)
            sess = await db.get_session(meta.sessionId)
            if sess:
                user_id = sess["userId"]
                urow = await db.pool.fetchrow('SELECT name FROM "User" WHERE id = $1', user_id)
                if urow:
                    learner = urow["name"]
                profile = await db.get_profile(user_id) if user_id else None
        except Exception as e:  # noqa: BLE001
            log.warning("config.db_lookup_failed", error=str(e))

    if scenario is None:
        scenario = fixture_scenario()
        log.warning("scenario.fallback", scenario=scenario.id)

    return SessionConfig(
        meta=meta,
        scenario=scenario,
        learner_name=learner,
        user_id=user_id,
        profile=profile,
        max_minutes=s.max_session_minutes,
    )


# ───────────────────────────── worker ─────────────────────────────


def prewarm(proc: JobProcess) -> None:
    configure_logging()
    proc.userdata["vad"] = load_vad()
    log.info("prewarm.done")


async def connect_db(s: Settings) -> Database | None:
    db = Database(s.database_url)
    try:
        await asyncio.wait_for(db.connect(), timeout=5)
        return db
    except Exception as e:  # noqa: BLE001
        log.warning("db.unavailable", error=str(e), note="running without persistence")
        return None


def build_session(s: Settings, cfg: SessionConfig, vad: Any) -> AgentSession:
    turn_detection = make_turn_detection()
    return AgentSession(
        stt=make_stt(s),
        llm=make_llm(s),
        tts=make_tts(s, voice=cfg.meta.voice, speed=cfg.meta.speed),
        vad=vad,
        turn_handling={
            "turn_detection": turn_detection,
            "endpointing": {"mode": "dynamic", "min_delay": 0.5, "max_delay": 3.0},
            "interruption": {
                "enabled": True,
                "min_duration": 0.5,
                "resume_false_interruption": True,
                "false_interruption_timeout": 1.0,
            },
            "preemptive_generation": {"enabled": True},
        },
        user_away_timeout=15.0,
        aec_warmup_duration=3.0,
        tts_text_transforms=["filter_markdown", "filter_emoji"],
    )


def wire_events(session: AgentSession, ctl: SessionControl) -> None:
    tracker = ctl.tracker

    @session.on("conversation_item_added")
    def _item(ev: ConversationItemAddedEvent) -> None:
        tracker.on_item_added(ev)

    @session.on("function_tools_executed")
    def _tools(ev: FunctionToolsExecutedEvent) -> None:
        tracker.on_tools_executed(ev)

    @session.on("metrics_collected")
    def _metrics(ev: MetricsCollectedEvent) -> None:
        tracker.on_metrics(ev)

    @session.on("user_input_transcribed")
    def _transcribed(ev: UserInputTranscribedEvent) -> None:
        if ev.is_final:
            ctl.last_user_activity = time.time()

    @session.on("user_state_changed")
    def _user_state(ev: UserStateChangedEvent) -> None:
        if ev.new_state == "speaking":
            ctl.last_user_activity = time.time()
            ctl.silence_stage = 0

    @session.on("agent_state_changed")
    def _agent_state(ev: AgentStateChangedEvent) -> None:
        if ev.old_state == "speaking" and ev.new_state != "speaking":
            ctl.last_agent_done = time.time()
            ctl.silence_stage = 0

    @session.on("agent_false_interruption")
    def _false_int(ev: AgentFalseInterruptionEvent) -> None:
        tracker.event("interruption", {"by": "noise", "false": True})


server = AgentServer(setup_fnc=prewarm, drain_timeout=90, session_end_timeout=300)


async def on_session_end(ctx: JobContext) -> None:
    """Runs after the room session closes: finalise the session row and run analysis."""
    ctl: SessionControl | None = ctx.proc.userdata.get("ctl")
    if ctl is None:
        return
    s = settings()
    db: Database | None = ctx.proc.userdata.get("db")
    tracker = ctl.tracker
    duration = int(time.time() - ctl.started_at)
    try:
        await tracker.flush_usage(s.llm_model, s.llm_provider)
        await tracker.close()
        if db is not None and ctl.cfg.user_id is not None:
            await db.mark_ended(
                ctl.cfg.meta.sessionId,
                reason=ctl.end_reason or "room_closed",
                duration_sec=duration,
            )
            from .analysis.pipeline import analyze_session  # TODO(phase-8): full pipeline

            await analyze_session(db, ctl.cfg.meta.sessionId, s)
    except Exception as e:  # noqa: BLE001
        log.error("session_end.failed", error=str(e))
    finally:
        if db is not None:
            await db.close()
        log.info("session.finished", duration_sec=duration, reason=ctl.end_reason)


@server.rtc_session(agent_name=settings().agent_name, on_session_end=on_session_end)
async def entrypoint(ctx: JobContext) -> None:
    s = settings()
    meta = parse_metadata(ctx)
    db = await connect_db(s)
    cfg = await load_config(db, meta, s)
    bind_session(
        cfg.meta.sessionId,
        room=ctx.room.name if ctx.room else None,
        scenario=cfg.scenario.id,
        mode=cfg.meta.coachingMode,
    )
    ctx.log_context_fields = {"session_id": cfg.meta.sessionId, "room": ctx.room.name}

    store: Store = DbStore(db) if db is not None else NullStore()
    tracker = SessionTracker(store, cfg.meta.sessionId)
    tracker.start()
    ctl = SessionControl(cfg=cfg, tracker=tracker, ctx=ctx)
    ctx.proc.userdata["ctl"] = ctl
    ctx.proc.userdata["db"] = db

    await ctx.connect()

    session = build_session(s, cfg, ctx.proc.userdata.get("vad"))
    wire_events(session, ctl)
    agent = FluentAgent(cfg, ctl)

    await session.start(
        agent=agent,
        room=ctx.room,
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(), text_output=True, close_on_disconnect=True
        ),
        record=False,
    )
    tracker.t0 = time.time()
    ctl.started_at = time.time()
    if db is not None and cfg.user_id is not None:
        try:
            await db.mark_live(cfg.meta.sessionId)
        except Exception as e:  # noqa: BLE001
            log.warning("mark_live.failed", error=str(e))
    ctl.spawn(watchdog(ctl, session), "watchdog")
    log.info(
        "session.live",
        scenario=cfg.scenario.id,
        difficulty=cfg.meta.difficulty,
        learner=cfg.learner_name,
    )


def run() -> None:
    configure_logging()
    cli.run_app(server)


if __name__ == "__main__":
    run()
