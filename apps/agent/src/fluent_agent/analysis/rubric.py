"""LLM-judged metrics with a strict JSON schema (temperature 0, evidence quotes required).

`judge()` calls OpenAI (JSON-schema structured output) or Anthropic (tool-use schema) directly
through their SDKs (already installed as plugin dependencies). With no key, or FLUENT_FAKE_LLM=1,
`scripted_judgement()` produces a deterministic, schema-valid judgement from the transcript so the
whole pipeline runs offline and in tests.
"""

from __future__ import annotations

import json
import re
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationError

from ..log import get_logger
from ..schemas import (
    Cefr,
    GrammarCategory,
    GrammarError,
    Judged,
    Priority,
    RecommendedDrill,
    Rewrite,
    Scenario,
    Strength,
    TaskCriterion,
    VocabBankEntry,
)
from ..settings import Settings
from .metrics import Deterministic, Utterance

log = get_logger("rubric")

JudgeProvider = Literal["openai", "anthropic", "scripted"]


class Judgement(BaseModel):
    """What the judge model must return. Validated strictly; one retry on schema failure."""

    model_config = ConfigDict(extra="forbid")

    judged: Judged
    grammarErrors: list[GrammarError] = Field(max_length=40)
    rewrites: list[Rewrite] = Field(max_length=10)
    strengths: list[Strength] = Field(max_length=3)
    priorities: list[Priority] = Field(max_length=3)
    taskCriteria: list[TaskCriterion]
    vocabBank: list[VocabBankEntry] = Field(max_length=12)
    summary: str
    overallCefr: Cefr


RUBRIC = """You are an expert spoken-English examiner and communication coach for Indian English speakers (Hindi/Marathi L1).
Grade ONLY the learner's turns (marked LEARNER). The agent's turns (marked AGENT) are context.
Be fair and encouraging but precise. Every claim needs an evidence quote copied verbatim from the learner's words.

Scores are 0-100. Bands are CEFR (A1-C2). Categories for grammar errors: tense, article, preposition, subject_verb, word_order, plural, modal, conditional, other. Severity 1 minor, 2 moderate, 3 major (blocks meaning).

Judge these dimensions:
- grammar: accuracy; list concrete errors with corrections and one-line explanations (max 40, most important first).
- vocabulary: range and precision; mention upgrade suggestions in the comment.
- fluency: flow, linking words, staying on topic, coherence (use the pause/filler statistics supplied).
- pronunciation: judged from low-confidence STT words and context; name flagged words.
- taskAchievement: check each success criterion with evidence (met true/false).
- communication: structure (e.g. STAR), conciseness, activeListening (did they answer what was asked), register (appropriate formality for the scene), assertiveness, questionAsking, empathy, persuasiveness, hedging (100 = confident, little hedging).
- interview (only for interview-mode scenarios; otherwise null): answerStructure, relevance, redFlags, hireability, reasons.
- ielts (only when the scenario is an IELTS exam; otherwise null): band scores 0-9 with .5 steps.

Also produce:
- rewrites: 5-10 of the learner's actual sentences rewritten at native-professional level with a one-line why (fewer if the learner said little).
- strengths (max 3) and priorities (max 3) with concrete examples from THIS session; priorities include a fix.
- vocabBank: up to 12 useful words/phrases (advanced words the agent used, or words the learner should learn), each with a simple definition, an example sentence, IPA if you know it, and part of speech.
- summary: one encouraging, specific paragraph (60-120 words) in plain English.
- overallCefr: the learner's overall level in this session.

Return ONLY JSON matching the schema."""


def transcript_text(utts: list[Utterance]) -> str:
    lines = []
    for u in utts:
        who = "LEARNER" if u.speaker == "human" else "AGENT"
        lines.append(f"[{u.start_ms // 1000:>4}s] {who}: {u.text}")
    return "\n".join(lines)


def build_user_prompt(
    scenario: Scenario, coaching_mode: str, utts: list[Utterance], det: Deterministic
) -> str:
    low_conf = (
        ", ".join(
            f"{w.word} ({w.confidence:.2f})" for w in det.pronunciation.lowConfidenceWords[:15]
        )
        or "none"
    )
    stats = (
        f"Deterministic stats — words: {det.vocabulary.totalWords}, WPM: {det.wpm}, fillers/100: {det.fillers.per100Words} "
        f"({', '.join(f'{k}×{v}' for k, v in list(det.fillers.byWord.items())[:5]) or 'none'}), long pauses (>1.5s): {det.pauses.over1500ms}, "
        f"mean response latency: {det.meanResponseLatencyMs:.0f} ms, talk share: {det.talkSharePct}%, code-switches: {det.codeSwitches.count}, "
        f"vocab beyond top-2k: {100 - det.vocabulary.pctTop2k:.0f}%, low-confidence words: {low_conf}."
    )
    criteria = "\n".join(f"- {c}" for c in scenario.successCriteria)
    return (
        f"SCENARIO: {scenario.title} ({scenario.mode}, difficulty {scenario.difficulty}). {scenario.description}\n"
        f"Learner goal: {scenario.learnerGoal}\nSuccess criteria:\n{criteria}\n"
        f"Coaching mode: {coaching_mode}. Scenario tags: {', '.join(scenario.tags or [])}\n\n{stats}\n\nTRANSCRIPT:\n{transcript_text(utts)}"
    )


def judge_provider(s: Settings) -> JudgeProvider:
    if s.fake_llm:
        return "scripted"
    if s.analysis_provider == "anthropic" and s.anthropic_api_key:
        return "anthropic"
    if s.openai_api_key:
        return "openai"
    if s.anthropic_api_key:
        return "anthropic"
    return "scripted"


async def judge(
    s: Settings, scenario: Scenario, coaching_mode: str, utts: list[Utterance], det: Deterministic
) -> tuple[Judgement, dict[str, int]]:
    """Returns (judgement, usage{input_tokens, output_tokens}). Retries once on invalid JSON/schema."""
    provider = judge_provider(s)
    if provider == "scripted":
        return scripted_judgement(scenario, utts, det), {"input_tokens": 0, "output_tokens": 0}
    prompt = build_user_prompt(scenario, coaching_mode, utts, det)
    schema = Judgement.model_json_schema()
    last_err: Exception | None = None
    usage = {"input_tokens": 0, "output_tokens": 0}
    for attempt in range(2):
        try:
            if provider == "openai":
                raw, usage = await _call_openai(s, prompt, schema, retry_note=last_err)
            else:
                raw, usage = await _call_anthropic(s, prompt, schema, retry_note=last_err)
            data = json.loads(raw) if isinstance(raw, str) else raw
            return Judgement.model_validate(data), usage
        except (ValidationError, json.JSONDecodeError) as e:
            last_err = e
            log.warning("judge.invalid_output", attempt=attempt, error=str(e)[:300])
    raise RuntimeError(f"judge returned invalid output twice: {last_err}")


async def _call_openai(
    s: Settings, prompt: str, schema: dict[str, Any], retry_note: Exception | None
) -> tuple[str, dict[str, int]]:
    import openai
    from openai.types.chat import ChatCompletionMessageParam
    from openai.types.shared_params import ResponseFormatJSONSchema

    client = openai.AsyncOpenAI(api_key=s.openai_api_key)
    messages: list[ChatCompletionMessageParam] = [
        {"role": "system", "content": RUBRIC},
        {"role": "user", "content": prompt},
    ]
    if retry_note:
        messages.append(
            {
                "role": "user",
                "content": f"Your previous answer failed validation: {str(retry_note)[:500]}. Return valid JSON only.",
            }
        )
    response_format: ResponseFormatJSONSchema = {
        "type": "json_schema",
        "json_schema": {"name": "judgement", "schema": _openai_strict(schema), "strict": True},
    }
    resp = await client.chat.completions.create(
        model=s.analysis_model,
        temperature=0,
        messages=messages,
        response_format=response_format,
    )
    content = resp.choices[0].message.content or "{}"
    u = resp.usage
    return content, {
        "input_tokens": u.prompt_tokens if u else 0,
        "output_tokens": u.completion_tokens if u else 0,
    }


async def _call_anthropic(
    s: Settings, prompt: str, schema: dict[str, Any], retry_note: Exception | None
) -> tuple[Any, dict[str, int]]:
    import anthropic

    client = anthropic.AsyncAnthropic(api_key=s.anthropic_api_key)
    model = s.analysis_model if s.analysis_model.startswith("claude") else "claude-sonnet-4-6"
    content = prompt + (
        f"\n\nYour previous answer failed validation: {str(retry_note)[:500]}."
        if retry_note
        else ""
    )
    resp = await client.messages.create(
        model=model,
        max_tokens=6000,
        system=RUBRIC,
        messages=[{"role": "user", "content": content}],
        tools=[
            {
                "name": "submit_judgement",
                "description": "Submit the structured judgement.",
                "input_schema": schema,
            }
        ],
        tool_choice={"type": "tool", "name": "submit_judgement"},
    )
    from anthropic.types import ToolUseBlock

    data: Any = next((b.input for b in resp.content if isinstance(b, ToolUseBlock)), {})
    return data, {
        "input_tokens": resp.usage.input_tokens,
        "output_tokens": resp.usage.output_tokens,
    }


def _openai_strict(schema: dict[str, Any]) -> dict[str, Any]:
    """OpenAI strict mode needs additionalProperties:false and all properties required on every object."""

    def walk(node: Any) -> Any:
        if isinstance(node, dict):
            if node.get("type") == "object" and "properties" in node:
                node["additionalProperties"] = False
                node["required"] = list(node["properties"].keys())
            for k, v in list(node.items()):
                if k in ("properties", "$defs"):
                    for kk in v:
                        v[kk] = walk(v[kk])
                elif isinstance(v, dict | list):
                    node[k] = walk(v)
            return node
        if isinstance(node, list):
            return [walk(x) for x in node]
        return node

    return walk(json.loads(json.dumps(schema)))


# ───────────────────────────── scripted judge ─────────────────────────────

_RULES: list[tuple[re.Pattern[str], str, GrammarCategory, str, int]] = [
    (
        re.compile(
            r"\b(am|is|are) (working|living|staying|studying)\b[^.?!]*\bsince (\d+|two|three|four|five|six) (years|months)\b",
            re.I,
        ),
        "have been \\2 … for \\3 \\4",
        "tense",
        "Use the present perfect continuous with 'for' + duration.",
        2,
    ),
    (
        re.compile(r"\bsince (\d+|two|three|four|five|six) (years|months)\b", re.I),
        "for \\1 \\2",
        "preposition",
        "'For' introduces a duration; 'since' introduces a starting point.",
        2,
    ),
    (
        re.compile(r"\bmyself (\w+)", re.I),
        "I'm \\1",
        "other",
        "Introduce yourself with 'I'm …', not 'myself'.",
        1,
    ),
    (
        re.compile(r"\bdiscuss about\b", re.I),
        "discuss",
        "preposition",
        "'Discuss' takes a direct object.",
        1,
    ),
    (
        re.compile(r"\bI didn't knew\b", re.I),
        "I didn't know",
        "tense",
        "After 'didn't' use the base verb.",
        2,
    ),
    (
        re.compile(r"\brevert back\b", re.I),
        "get back to you",
        "other",
        "'Revert back' is redundant.",
        1,
    ),
    (re.compile(r"\bI am agree\b", re.I), "I agree", "other", "'Agree' is a verb: 'I agree'.", 2),
    (
        re.compile(r"\bone of my friend\b", re.I),
        "one of my friends",
        "plural",
        "'One of' takes a plural noun.",
        1,
    ),
    (
        re.compile(r"\bgive me the (same)\b", re.I),
        "send it to me",
        "other",
        "Avoid 'the same' as a pronoun in speech.",
        1,
    ),
    (
        re.compile(r"\b(he|she|it) (don't|have)\b", re.I),
        "\\1 doesn't / has",
        "subject_verb",
        "Third-person singular needs -s.",
        2,
    ),
]


def scripted_judgement(scenario: Scenario, utts: list[Utterance], det: Deterministic) -> Judgement:
    learner = [u for u in utts if u.speaker == "human"]
    text = " ".join(u.text for u in learner)
    words = max(1, det.vocabulary.totalWords)
    errors: list[GrammarError] = []
    for pat, repl, cat, why, sev in _RULES:
        for m in pat.finditer(text):
            if len(errors) >= 40:
                break
            errors.append(
                GrammarError(
                    quote=m.group(0),
                    correction=pat.sub(repl, m.group(0)),
                    category=cat,
                    explanation=why,
                    severity=sev,
                )
            )  # type: ignore[arg-type]
    err_rate = len(errors) / (words / 100)
    grammar = _clamp(88 - err_rate * 9)
    vocab = _clamp(
        45 + (100 - det.vocabulary.pctTop2k) * 1.8 + min(15, len(det.vocabulary.advancedWords) * 2)
    )
    fluency = _clamp(
        92
        - det.fillers.per100Words * 3
        - det.pauses.over1500ms * 1.5
        - max(0, 110 - det.wpm) * 0.25
    )
    pron = _clamp(
        det.pronunciation.meanConfidence * 100 if det.pronunciation.meanConfidence else 78
    )
    criteria = []
    for i, c in enumerate(scenario.successCriteria):
        met = len(learner) > i and words > 25 * (i + 1)
        ev = learner[min(i, len(learner) - 1)].text[:120] if learner else ""
        criteria.append(TaskCriterion(criterion=c, met=met, evidence=ev))
    task = _clamp(100 * sum(1 for c in criteria if c.met) / max(1, len(criteria)))
    questions = det.sentences.pctQuestions
    comm_score = _clamp((grammar + fluency + task) / 3 + (5 if questions > 5 else -5))
    band = _band(sum([grammar, vocab, fluency, pron]) / 4)
    sents = [
        s.strip()
        for u in learner
        for s in re.split(r"(?<=[.!?])\s+", u.text)
        if len(s.split()) >= 5
    ][:8]
    rewrites = [
        Rewrite(original=s, better=_tidy(s), why="Shorter, no filler, and a precise verb.")
        for s in sents
        if _tidy(s) != s
    ][:10]
    advanced = det.vocabulary.advancedWords[:4]
    vocab_bank = [
        VocabBankEntry(
            word=w,
            definition=f"'{w}' — look up a precise definition and use it in your next session.",
            example=f"I used the word {w} in the {scenario.title} practice.",
            ipa=None,
            partOfSpeech=None,
        )
        for w in advanced
    ]
    for w in scenario.keyVocabulary[:4]:
        if len(vocab_bank) >= 8:
            break
        vocab_bank.append(
            VocabBankEntry(
                word=w,
                definition=f"Key phrase for '{scenario.title}'.",
                example=next(
                    (p for p in scenario.usefulPhrases if w.lower() in p.lower()),
                    scenario.usefulPhrases[0] if scenario.usefulPhrases else w,
                ),
                ipa=None,
                partOfSpeech=None,
            )
        )
    strengths = (
        [Strength(title="Kept the conversation going", example=learner[0].text[:100])]
        if learner
        else []
    )
    if det.fillers.per100Words < 3 and learner:
        strengths.append(
            Strength(title="Few filler words", example=f"{det.fillers.per100Words} per 100 words")
        )
    if questions > 5 and learner:
        strengths.append(
            Strength(
                title="Asked questions",
                example=next((u.text for u in learner if "?" in u.text), learner[0].text)[:100],
            )
        )
    priorities = []
    if errors:
        e = errors[0]
        priorities.append(
            Priority(
                title=f"{e.category.replace('_', ' ').title()} accuracy",
                example=e.quote,
                fix=e.correction,
            )
        )
    if det.fillers.per100Words >= 3:
        top = next(iter(det.fillers.byWord), "um")
        priorities.append(
            Priority(
                title="Fewer fillers",
                example=f"'{top}' appeared {det.fillers.byWord.get(top, 0)} times",
                fix="Pause silently instead of saying a filler.",
            )
        )
    if det.wpm and det.wpm < 110:
        priorities.append(
            Priority(
                title="Pace",
                example=f"{det.wpm} words per minute",
                fix="Aim for 120–160 WPM: shorter sentences, fewer restarts.",
            )
        )
    priorities = priorities[:3]
    summary = (
        f"You spoke for about {det.speakingTimeSec / 60:.1f} minutes at {det.wpm:.0f} words per minute with {det.fillers.per100Words} fillers per 100 words. "
        f"{len(errors)} grammar slip{'s' if len(errors) != 1 else ''} stood out. Keep building on what you did well: {strengths[0].title.lower() if strengths else 'staying engaged'}. "
        f"Next time, focus on {priorities[0].title.lower() if priorities else 'adding more detail'}."
    )
    return Judgement(
        judged=Judged(
            grammar={
                "score": grammar,
                "band": band,
                "evidence": [e.quote for e in errors[:3]],
                "comment": f"{len(errors)} errors detected by rules; see list.",
            },  # type: ignore[arg-type]
            vocabulary={
                "score": vocab,
                "band": _band(vocab),
                "evidence": advanced[:3],
                "comment": f"{100 - det.vocabulary.pctTop2k:.0f}% of words beyond the 2k most common.",
            },  # type: ignore[arg-type]
            fluency={
                "score": fluency,
                "band": _band(fluency),
                "evidence": [],
                "comment": f"{det.pauses.over1500ms} long pauses, {det.fillers.total} fillers.",
            },  # type: ignore[arg-type]
            pronunciation={
                "score": pron,
                "band": _band(pron),
                "evidence": [w.word for w in det.pronunciation.lowConfidenceWords[:3]],
                "comment": "Based on STT confidence.",
            },  # type: ignore[arg-type]
            taskAchievement={
                "score": task,
                "band": _band(task),
                "evidence": [c.evidence for c in criteria if c.met][:3],
                "comment": f"{sum(1 for c in criteria if c.met)}/{len(criteria)} criteria met.",
            },  # type: ignore[arg-type]
            communication={  # type: ignore[arg-type]
                "score": comm_score,
                "band": _band(comm_score),
                "evidence": [],
                "comment": "Heuristic estimate (scripted judge).",
                "structure": _clamp(comm_score),
                "conciseness": _clamp(100 - det.sentences.avgLength * 2),
                "activeListening": _clamp(task),
                "register": 75,
                "assertiveness": _clamp(70 - det.fillers.per100Words * 2),
                "questionAsking": _clamp(40 + questions * 4),
                "empathy": 70,
                "persuasiveness": 65,
                "hedging": _clamp(85 - det.fillers.per100Words * 2),
            },
            interview={
                "answerStructure": _clamp(comm_score),
                "relevance": _clamp(task),
                "redFlags": [],
                "hireability": _clamp((comm_score + task) / 2),
                "reasons": "Scripted estimate: relevance and structure drive this score.",
            }
            if scenario.mode == "interview" and "ielts" not in (scenario.tags or [])
            else None,  # type: ignore[arg-type]
            ielts={
                "fluencyCoherence": _ielts(fluency),
                "lexicalResource": _ielts(vocab),
                "grammaticalRange": _ielts(grammar),
                "pronunciation": _ielts(pron),
                "overall": _ielts((fluency + vocab + grammar + pron) / 4),
            }
            if "ielts" in (scenario.tags or [])
            else None,  # type: ignore[arg-type]
        ),
        grammarErrors=errors,
        rewrites=rewrites,
        strengths=strengths[:3],
        priorities=priorities,
        taskCriteria=criteria,
        vocabBank=vocab_bank[:12],
        summary=summary,
        overallCefr=band,
    )


def _clamp(v: float) -> float:
    return float(max(0, min(100, round(v, 1))))


def _band(score: float) -> Cefr:
    if score >= 90:
        return "C2"
    if score >= 78:
        return "C1"
    if score >= 64:
        return "B2"
    if score >= 48:
        return "B1"
    if score >= 30:
        return "A2"
    return "A1"


def _ielts(score: float) -> float:
    return round(max(3.0, min(9.0, 3 + score / 100 * 6)) * 2) / 2


def _tidy(s: str) -> str:
    out = re.sub(r"\b(um|uh|basically|actually|like|you know|i mean)\b[, ]*", "", s, flags=re.I)
    out = re.sub(r"\s{2,}", " ", out).strip()
    out = re.sub(r"\bvery good\b", "excellent", out, flags=re.I)
    out = re.sub(r"\bsince (\d+|two|three|four|five) years\b", r"for \1 years", out, flags=re.I)
    return out[:1].upper() + out[1:] if out else s


def recommended_drills(
    scenario: Scenario, det: Deterministic, j: Judgement
) -> list[RecommendedDrill]:
    """Map weaknesses to seeded drill scenario ids (ids exist in apps/web/prisma/seed-data)."""
    out: list[RecommendedDrill] = []
    if det.fillers.per100Words >= 3:
        out.append(
            RecommendedDrill(
                scenarioId="fluency-filler-elimination",
                reason=f"{det.fillers.per100Words} fillers per 100 words",
            )
        )
    cats = [e.category for e in j.grammarErrors]
    if cats.count("tense") >= 2 or cats.count("preposition") >= 2:
        out.append(
            RecommendedDrill(
                scenarioId="fluency-paraphrase-challenge",
                reason="Recurring tense/preposition slips — practise re-phrasing",
            )
        )
    phon = {f.phoneme for f in det.pronunciation.l1Flags}
    if "v/w" in phon:
        out.append(RecommendedDrill(scenarioId="pron-v-vs-w", reason="Low-confidence v/w words"))
    elif "th" in phon:
        out.append(
            RecommendedDrill(scenarioId="pron-th-sounds", reason="Low-confidence 'th' words")
        )
    if j.judged.vocabulary.score < 60:
        out.append(
            RecommendedDrill(
                scenarioId="fluency-vocabulary-upgrade", reason="Vocabulary range below B2"
            )
        )
    if det.wpm and det.wpm < 110:
        out.append(
            RecommendedDrill(
                scenarioId="fluency-60-second-talk",
                reason=f"Pace {det.wpm:.0f} WPM — build momentum",
            )
        )
    if not out:
        out.append(
            RecommendedDrill(
                scenarioId=scenario.id, reason="Repeat this scenario at a higher difficulty"
            )
        )
    return out[:3]
