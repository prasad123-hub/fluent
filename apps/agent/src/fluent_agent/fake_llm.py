"""Deterministic scripted LLM used when FLUENT_FAKE_LLM=1 (no API keys).

It proves the full plumbing — tools, persistence, handoffs, timers — in `lk agent debugger`
and pytest without a model. It is intentionally simple: a few rules on the last user turn.
Never use in production.
"""

from __future__ import annotations

import json
import re
import time
from typing import Any

from livekit.agents.llm import (
    LLM,
    ChatChunk,
    ChatContext,
    ChoiceDelta,
    FunctionToolCall,
    LLMStream,
    Tool,
    ToolChoice,
)
from livekit.agents.types import (
    DEFAULT_API_CONNECT_OPTIONS,
    NOT_GIVEN,
    APIConnectOptions,
    NotGivenOr,
)

CORRECTIONS: list[tuple[re.Pattern[str], str, str, str]] = [
    (
        re.compile(r"\bsince (\d+|two|three|four|five) years\b", re.I),
        "for \\1 years",
        "tense",
        "Use 'for' with a duration; 'since' takes a point in time.",
    ),
    (
        re.compile(r"\bI am (working|living|staying) here since\b", re.I),
        "I have been \\1 here since",
        "tense",
        "Use the present perfect continuous for actions that started in the past and continue.",
    ),
    (
        re.compile(r"\bmyself (\w+)", re.I),
        "I'm \\1",
        "other",
        "'Myself X' is not used for introductions in English.",
    ),
    (
        re.compile(r"\bdiscuss about\b", re.I),
        "discuss",
        "preposition",
        "'Discuss' takes a direct object: discuss the plan.",
    ),
    (
        re.compile(r"\bI didn't knew\b", re.I),
        "I didn't know",
        "tense",
        "After 'didn't', use the base form of the verb.",
    ),
    (
        re.compile(r"\brevert back\b", re.I),
        "reply",
        "other",
        "'Revert back' is redundant; say 'reply' or 'get back to you'.",
    ),
]

HINDI_WORDS = re.compile(
    r"\b(matlab|yaar|haan|nahi|acha|thoda|bahut|kyunki|lekin|kal|aaj|bas|theek)\b", re.I
)


class ScriptedLLM(LLM):
    def __init__(self) -> None:
        super().__init__()
        self.turns = 0

    @property
    def model(self) -> str:
        return "scripted"

    @property
    def provider(self) -> str:
        return "fluent-fake"

    def chat(
        self,
        *,
        chat_ctx: ChatContext,
        tools: list[Tool] | None = None,
        conn_options: APIConnectOptions = DEFAULT_API_CONNECT_OPTIONS,
        parallel_tool_calls: NotGivenOr[bool] = NOT_GIVEN,
        tool_choice: NotGivenOr[ToolChoice] = NOT_GIVEN,
        extra_kwargs: NotGivenOr[dict[str, Any]] = NOT_GIVEN,
    ) -> LLMStream:
        return ScriptedStream(self, chat_ctx=chat_ctx, tools=tools or [], conn_options=conn_options)


def _tool_names(tools: list[Tool]) -> set[str]:
    names: set[str] = set()
    for t in tools:
        info = getattr(t, "info", None)
        name = getattr(info, "name", None) or getattr(t, "__name__", None)
        if name:
            names.add(name)
    return names


def plan_reply(chat_ctx: ChatContext, tools: list[Tool]) -> tuple[str, list[FunctionToolCall]]:
    """Pure function so tests can assert on it. Returns (content, tool_calls)."""
    items = chat_ctx.items
    available = _tool_names(tools)
    last = items[-1] if items else None
    calls: list[FunctionToolCall] = []
    n = int(time.time() * 1000) % 100000

    if last is not None and last.type == "function_call_output":
        out = last.output or ""
        if "hint:" in out.lower():
            return out.split(":", 1)[1].strip(), []
        if "summary" in out.lower():
            return "Thanks for practising with me today. Great effort — see you next time!", []
        return "Got it. Let's continue — tell me more.", []

    text = ""
    if last is not None and last.type == "message" and last.role in ("user", "system"):
        text = last.text_content or ""
    low = text.lower().strip()

    # instructions from generate_reply(instructions=...) / on_enter
    if last is not None and last.type == "message" and last.role == "system":
        if "opening line:" in low:
            return text.split("line:", 1)[1].strip(), []
        if "greet" in low:
            return (
                "Hello! Thanks for joining. To start, could you tell me a little about yourself?",
                [],
            )
        if "silent" in low or "prompt" in low:
            return "Take your time. Shall I rephrase the question?", []
        if "wrap" in low or "end" in low:
            return "We're almost out of time. Any final thoughts before we wrap up?", []
        return "Sure. Let's keep going.", []

    if not text:
        return "Hello! Could you tell me a little about yourself?", []

    if "give_hint" in available and ("help" in low or "hint" in low or "what should i say" in low):
        calls.append(FunctionToolCall(name="give_hint", arguments="{}", call_id=f"call_hint_{n}"))
        return "", calls
    if "end_session_with_summary" in available and (
        "end the session" in low or "let's stop" in low or "goodbye" in low
    ):
        calls.append(
            FunctionToolCall(
                name="end_session_with_summary",
                arguments='{"summary": "The learner practised a self-introduction and answered follow-up questions."}',
                call_id=f"call_end_{n}",
            )
        )
        return "", calls
    if "change_tts_speed" in available and ("slow down" in low or "speak slower" in low):
        calls.append(
            FunctionToolCall(
                name="change_tts_speed", arguments='{"rate": 0.85}', call_id=f"call_speed_{n}"
            )
        )
        return "Of course, I'll slow down a little.", calls

    for pat, repl, category, why in CORRECTIONS:
        m = pat.search(text)
        if m and "log_correction" in available:
            corrected = pat.sub(repl, text)
            calls.append(
                FunctionToolCall(
                    name="log_correction",
                    arguments=json.dumps(
                        {
                            "original": m.group(0),
                            "corrected": pat.sub(repl, m.group(0)),
                            "category": category,
                            "explanation": why,
                        }
                    ),
                    call_id=f"call_corr_{n}",
                )
            )
            return (
                f"Oh, {corrected.strip().rstrip('.')}? Nice. And what do you enjoy most about that?",
                calls,
            )

    hm = HINDI_WORDS.search(text)
    if hm and "log_code_switch" in available:
        calls.append(
            FunctionToolCall(
                name="log_code_switch",
                arguments=json.dumps({"text": hm.group(0), "suggestion": "I mean"}),
                call_id=f"call_cs_{n}",
            )
        )
        return "I think you mean 'I mean' — could you try saying that in English?", calls

    if "?" in text:
        return (
            "Good question. Our team is about forty people across Bengaluru and Pune, and we ship every two weeks. What else would you like to know?",
            [],
        )
    words = len(text.split())
    if words < 6:
        return "Could you tell me a bit more about that?", []
    return (
        "That's really interesting. Why did you choose that path, and what did you learn from it?",
        [],
    )


class ScriptedStream(LLMStream):
    def __init__(
        self,
        llm: ScriptedLLM,
        *,
        chat_ctx: ChatContext,
        tools: list[Tool],
        conn_options: APIConnectOptions,
    ) -> None:
        super().__init__(llm, chat_ctx=chat_ctx, tools=tools, conn_options=conn_options)
        self._scripted = llm

    async def _run(self) -> None:
        content, calls = plan_reply(self._chat_ctx, self._tools)
        self._scripted.turns += 1
        if content:
            for i in range(0, len(content), 24):
                self._event_ch.send_nowait(
                    ChatChunk(
                        id=f"scripted_{self._scripted.turns}",
                        delta=ChoiceDelta(role="assistant", content=content[i : i + 24]),
                    )
                )
        if calls:
            self._event_ch.send_nowait(
                ChatChunk(
                    id=f"scripted_{self._scripted.turns}",
                    delta=ChoiceDelta(role="assistant", tool_calls=calls),
                )
            )
