"""Deterministic spoken-English metrics computed from utterances (word timings) and events.

Pure functions; no I/O. Unit-tested in tests/test_metrics.py. Field names mirror the
`deterministic` block of packages/shared/schemas/analysis-report.schema.json.
"""

from __future__ import annotations

import json
import math
import re
from collections import Counter
from dataclasses import dataclass, field
from functools import lru_cache
from typing import Any

from ..schemas import (
    Cefr,
    CodeSwitches,
    CodeSwitchItem,
    Deterministic,
    FillerHit,
    Fillers,
    HistogramBucket,
    L1Flag,
    OverusedWord,
    PauseItem,
    Pauses,
    PronunciationStats,
    Repetitions,
    SentenceStats,
    TurnTaking,
    VocabularyStats,
    WordFlag,
    WpmPoint,
)

# ───────────────────────────── inputs ─────────────────────────────


@dataclass
class Word:
    text: str
    start_ms: int | None
    end_ms: int | None
    conf: float | None
    filler: bool = False


@dataclass
class Utterance:
    speaker: str  # "human" | "agent"
    text: str
    start_ms: int
    end_ms: int
    words: list[Word] = field(default_factory=list)
    interrupted: bool = False
    confidence: float | None = None


@dataclass
class Event:
    type: str
    at_ms: int
    payload: dict[str, Any]


def _as_obj(v: Any) -> Any:
    """Tolerate rows written before the jsonb codec was in place (JSON stored as a string)."""
    if isinstance(v, str):
        try:
            return json.loads(v)
        except ValueError:
            return v
    return v


def utterance_from_row(row: dict[str, Any]) -> Utterance:
    raw_words = _as_obj(row.get("words")) or []
    words = [
        Word(
            text=str(w.get("w", "")),
            start_ms=w.get("start"),
            end_ms=w.get("end"),
            conf=w.get("conf"),
            filler=bool(w.get("filler")),
        )
        for w in raw_words
        if isinstance(w, dict)
    ]
    return Utterance(
        speaker=row["speaker"],
        text=row["text"],
        start_ms=int(row["startMs"]),
        end_ms=int(row["endMs"]),
        words=words,
        interrupted=bool(row.get("interrupted")),
        confidence=row.get("confidence"),
    )


def event_from_row(row: dict[str, Any]) -> Event:
    payload = _as_obj(row.get("payload")) or {}
    return Event(
        type=row["type"],
        at_ms=int(row["atMs"]),
        payload=dict(payload) if isinstance(payload, dict) else {},
    )


# ───────────────────────────── lexicons ─────────────────────────────

FILLER_PHRASES: list[str] = [
    "you know",
    "i mean",
    "kind of",
    "sort of",
    "the thing is",
    "okay so",
]
FILLER_WORDS: set[str] = {
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
    "so",
    "right",
    "only",
    "itself",
    "na",
    "means",
}
HEDGES = ["i think maybe", "i guess", "sort of", "kind of", "maybe", "perhaps", "i'm not sure but"]
SUBORDINATORS = {
    "because",
    "although",
    "though",
    "while",
    "whereas",
    "since",
    "unless",
    "until",
    "if",
    "when",
    "whenever",
    "after",
    "before",
    "which",
    "who",
    "whom",
    "whose",
    "that",
    "where",
    "so that",
    "even",
}
QUESTION_STARTS = (
    "what",
    "why",
    "how",
    "when",
    "where",
    "who",
    "which",
    "could",
    "can",
    "would",
    "do",
    "does",
    "did",
    "is",
    "are",
    "will",
    "should",
    "shall",
    "may",
)

# Sounds Indian L1 speakers commonly struggle with, matched on spelling.
L1_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("v/w", re.compile(r"^(v|w)", re.I)),
    ("th", re.compile(r"th", re.I)),
    ("ee/i", re.compile(r"(ee|ea|i)[a-z]*$", re.I)),
    ("ʒ (measure/vision)", re.compile(r"(sion|sure|genre)$", re.I)),
    ("word stress", re.compile(r"^[a-z]{9,}$", re.I)),
]

_TOKEN = re.compile(r"[a-zA-Z][a-zA-Z'’-]*")


def tokenize(text: str) -> list[str]:
    return [t.lower().strip("'’-") for t in _TOKEN.findall(text) if t.strip("'’-")]


@lru_cache(maxsize=1)
def _freq_lists() -> tuple[set[str], set[str], set[str]]:
    try:
        from wordfreq import top_n_list

        top = top_n_list("en", 5000)
        return set(top[:1000]), set(top[:2000]), set(top)
    except Exception:  # pragma: no cover - wordfreq is a declared dependency
        return set(), set(), set()


def zipf(word: str) -> float:
    try:
        from wordfreq import zipf_frequency

        return float(zipf_frequency(word, "en"))
    except Exception:  # pragma: no cover
        return 5.0


# ───────────────────────────── metrics ─────────────────────────────


def speaking_time(utts: list[Utterance]) -> tuple[float, float, float]:
    """(user_sec, agent_sec, talk_share_pct)."""
    user = sum(max(0, u.end_ms - u.start_ms) for u in utts if u.speaker == "human") / 1000
    agent = sum(max(0, u.end_ms - u.start_ms) for u in utts if u.speaker == "agent") / 1000
    share = (user / (user + agent) * 100) if (user + agent) > 0 else 0.0
    return round(user, 1), round(agent, 1), round(share, 1)


def wpm_overall(utts: list[Utterance]) -> float:
    user = [u for u in utts if u.speaker == "human"]
    words = sum(len(tokenize(u.text)) for u in user)
    sec = sum(max(0, u.end_ms - u.start_ms) for u in user) / 1000
    if sec < 1:
        return 0.0
    return round(words / (sec / 60), 1)


def wpm_series(utts: list[Utterance]) -> list[WpmPoint]:
    """Words per minute for each session minute, counting only the seconds the learner spoke."""
    user = [u for u in utts if u.speaker == "human"]
    if not user:
        return []
    last_min = max(u.end_ms for u in user) // 60000
    out: list[WpmPoint] = []
    for m in range(last_min + 1):
        lo, hi = m * 60000, (m + 1) * 60000
        words = 0.0
        spoken_ms = 0
        for u in user:
            s, e = max(u.start_ms, lo), min(u.end_ms, hi)
            if e <= s:
                continue
            frac = (e - s) / max(1, u.end_ms - u.start_ms)
            words += len(tokenize(u.text)) * frac
            spoken_ms += e - s
        wpm = (words / (spoken_ms / 60000)) if spoken_ms > 3000 else 0.0
        out.append(WpmPoint(minute=m, wpm=round(wpm, 1)))
    return out


def pauses(utts: list[Utterance]) -> tuple[Pauses, float]:
    """Intra-turn pauses from word gaps, plus mean response latency (agent end → user start, ms)."""
    items: list[PauseItem] = []
    for u in utts:
        if u.speaker != "human":
            continue
        prev_end: int | None = None
        for w in u.words:
            if w.start_ms is not None and prev_end is not None:
                gap = w.start_ms - prev_end
                if gap >= 500:
                    items.append(PauseItem(atMs=prev_end, durationMs=gap))
            if w.end_ms is not None:
                prev_end = w.end_ms
    p = Pauses(
        over500ms=sum(1 for i in items if i.durationMs >= 500),
        over1500ms=sum(1 for i in items if i.durationMs >= 1500),
        over3000ms=sum(1 for i in items if i.durationMs >= 3000),
        totalPauseSec=round(sum(i.durationMs for i in items) / 1000, 1),
        list=items[:200],
    )
    latencies: list[int] = []
    ordered = sorted(utts, key=lambda u: u.start_ms)
    for a, b in zip(ordered, ordered[1:], strict=False):
        if a.speaker == "agent" and b.speaker == "human" and b.start_ms >= a.end_ms:
            latencies.append(b.start_ms - a.end_ms)
    mean = (sum(latencies) / len(latencies)) if latencies else 0.0
    return p, round(mean, 0)


def fillers(utts: list[Utterance]) -> Fillers:
    hits: list[FillerHit] = []
    by: Counter[str] = Counter()
    total_words = 0
    for u in utts:
        if u.speaker != "human":
            continue
        toks = tokenize(u.text)
        total_words += len(toks)
        joined = " " + " ".join(toks) + " "
        for phrase in FILLER_PHRASES:
            n = joined.count(f" {phrase} ")
            if n:
                by[phrase] += n
                hits.extend(FillerHit(word=phrase, atMs=u.start_ms) for _ in range(n))
        if u.words:
            for w in u.words:
                t = w.text.lower().strip(".,!?")
                if w.filler or t in FILLER_WORDS:
                    if t in {
                        "so",
                        "right",
                        "only",
                        "means",
                        "like",
                        "actually",
                    } and not _filler_context(t, toks):
                        continue
                    by[t] += 1
                    hits.append(
                        FillerHit(word=t, atMs=w.start_ms if w.start_ms is not None else u.start_ms)
                    )
        else:
            for i, t in enumerate(toks):
                if t in FILLER_WORDS and (
                    t not in {"so", "right", "only", "means", "like", "actually"}
                    or _filler_context(t, toks, i)
                ):
                    by[t] += 1
                    hits.append(FillerHit(word=t, atMs=u.start_ms))
    total = sum(by.values())
    per100 = (total / total_words * 100) if total_words else 0.0
    return Fillers(
        per100Words=round(per100, 1), total=total, byWord=dict(by.most_common()), hits=hits[:300]
    )


def _filler_context(t: str, toks: list[str], idx: int | None = None) -> bool:
    """Ambiguous words count as fillers only in filler positions (turn-initial / repeated / before a pause)."""
    if idx is None:
        idx = toks.index(t) if t in toks else 0
    if idx == 0:
        return True
    if idx + 1 < len(toks) and toks[idx + 1] == t:
        return True
    if t == "only" and idx == len(toks) - 1:  # "I did it only" (Indian English emphatic)
        return True
    if t == "means" and idx > 0 and toks[idx - 1] not in {"it", "that", "this", "which", "word"}:
        return True
    return bool(
        t in {"like", "basically", "actually"}
        and idx > 0
        and toks[idx - 1] in {"i", "it's", "was", "is", "and", "but", "so"}
    )


def repetitions(utts: list[Utterance]) -> Repetitions:
    count = 0
    false_starts = 0
    self_corr = 0
    examples: list[str] = []
    for u in utts:
        if u.speaker != "human":
            continue
        toks = tokenize(u.text)
        for i in range(len(toks) - 1):
            if toks[i] == toks[i + 1]:
                count += 1
                if len(examples) < 8:
                    examples.append(f"{toks[i]} {toks[i + 1]}")
        for i in range(len(toks) - 3):
            if toks[i : i + 2] == toks[i + 2 : i + 4]:
                count += 1
                if len(examples) < 8:
                    examples.append(" ".join(toks[i : i + 4]))
        low = u.text.lower()
        false_starts += len(re.findall(r"\b(i|we|it|the|he|she|they)\b[,\s]+(?:\1)\b", low))
        self_corr += len(
            re.findall(r"\b(sorry|i mean|no wait|no no|actually no|what i meant)\b", low)
        )
    return Repetitions(
        count=count, falseStarts=false_starts, selfCorrections=self_corr, examples=examples
    )


def mattr(tokens: list[str], window: int = 50) -> float:
    if not tokens:
        return 0.0
    if len(tokens) <= window:
        return round(len(set(tokens)) / len(tokens), 3)
    total = 0.0
    n = 0
    for i in range(len(tokens) - window + 1):
        total += len(set(tokens[i : i + window])) / window
        n += 1
    return round(total / n, 3)


def vocabulary(utts: list[Utterance]) -> VocabularyStats:
    toks: list[str] = []
    for u in utts:
        if u.speaker == "human":
            toks.extend(tokenize(u.text))
    content = [t for t in toks if t not in FILLER_WORDS and len(t) > 1]
    top1k, top2k, top5k = _freq_lists()
    n = len(toks)
    uniq = len(set(toks))

    def pct(s: set[str]) -> float:
        return (sum(1 for t in content if t in s) / len(content) * 100) if content else 0.0

    p1, p2, p5 = pct(top1k), pct(top2k), pct(top5k)
    advanced = sorted({t for t in content if len(t) >= 6 and zipf(t) < 4.0 and zipf(t) > 1.5})[:25]
    counts = Counter(content)
    overused = [
        OverusedWord(word=w, count=c)
        for w, c in counts.most_common(40)
        if c >= 4
        and w not in top1k
        and w not in {"work", "company", "team", "project", "people", "time", "years", "year"}
    ][:8]
    level = estimate_vocab_level(p1, p2, len(advanced), n)
    return VocabularyStats(
        totalWords=n,
        uniqueWords=uniq,
        ttr=round(uniq / n, 3) if n else 0.0,
        mattr=mattr(toks),
        avgWordLength=round(sum(len(t) for t in content) / len(content), 2) if content else 0.0,
        pctTop1k=round(p1, 1),
        pctTop2k=round(p2, 1),
        pctTop5k=round(p5, 1),
        estimatedLevel=level,
        advancedWords=advanced,
        overusedWords=overused,
    )


def estimate_vocab_level(p1: float, p2: float, advanced: int, n: int) -> Cefr:
    """Coarse CEFR estimate from how much of the speech sits outside the most common words."""
    if n < 40:
        return "A2"
    beyond2k = 100 - p2
    if beyond2k >= 18 and advanced >= 8:
        return "C1"
    if beyond2k >= 12 and advanced >= 4:
        return "B2"
    if beyond2k >= 6 or advanced >= 2:
        return "B1"
    return "A2"


def sentences(utts: list[Utterance]) -> SentenceStats:
    sents: list[str] = []
    for u in utts:
        if u.speaker != "human":
            continue
        parts = [p.strip() for p in re.split(r"(?<=[.!?])\s+|\n", u.text) if p.strip()]
        if not parts and u.text.strip():
            parts = [u.text.strip()]
        sents.extend(parts)
    if not sents:
        return SentenceStats(count=0, avgLength=0.0, pctQuestions=0.0, pctComplex=0.0)
    lengths = [len(tokenize(s)) for s in sents]
    questions = sum(
        1 for s in sents if s.endswith("?") or tokenize(s)[:1] in [[q] for q in QUESTION_STARTS]
    )
    complex_ = sum(
        1
        for s in sents
        if any(t in SUBORDINATORS for t in tokenize(s)[1:]) and len(tokenize(s)) >= 6
    )
    return SentenceStats(
        count=len(sents),
        avgLength=round(sum(lengths) / len(lengths), 1),
        pctQuestions=round(questions / len(sents) * 100, 1),
        pctComplex=round(complex_ / len(sents) * 100, 1),
    )


def pronunciation(utts: list[Utterance]) -> PronunciationStats:
    words = [w for u in utts if u.speaker == "human" for w in u.words if w.conf is not None]
    if not words:
        confs = [u.confidence for u in utts if u.speaker == "human" and u.confidence is not None]
        mean = (sum(confs) / len(confs)) if confs else 0.0
        return PronunciationStats(
            meanConfidence=round(mean, 3), lowConfidenceWords=[], confidenceHistogram=[], l1Flags=[]
        )
    mean = sum(w.conf or 0 for w in words) / len(words)
    buckets: Counter[str] = Counter()
    for w in words:
        c = w.conf or 0
        key = f"{math.floor(c * 10) / 10:.1f}-{min(1.0, math.floor(c * 10) / 10 + 0.1):.1f}"
        buckets[key] += 1
    low = [w for w in words if (w.conf or 0) < 0.6 and len(w.text.strip(".,!?")) > 2]
    flags: list[WordFlag] = []
    l1: dict[str, list[str]] = {}
    for w in sorted(low, key=lambda x: x.conf or 0)[:40]:
        clean = w.text.strip(".,!?").lower()
        phoneme = next((name for name, pat in L1_PATTERNS if pat.search(clean)), None)
        flags.append(
            WordFlag(
                word=clean, confidence=round(w.conf or 0, 3), atMs=w.start_ms or 0, phoneme=phoneme
            )
        )
        if phoneme:
            l1.setdefault(phoneme, [])
            if clean not in l1[phoneme]:
                l1[phoneme].append(clean)
    return PronunciationStats(
        meanConfidence=round(mean, 3),
        lowConfidenceWords=flags,
        confidenceHistogram=[
            HistogramBucket(bucket=k, count=v) for k, v in sorted(buckets.items())
        ],
        l1Flags=[L1Flag(phoneme=k, words=v[:10]) for k, v in l1.items()],
    )


def code_switches(events: list[Event]) -> CodeSwitches:
    items: list[CodeSwitchItem] = []
    seen: set[tuple[str, int]] = set()
    for e in events:
        if e.type != "code_switch":
            continue
        text = str(e.payload.get("text") or " ".join(e.payload.get("words") or []))
        key = (text.lower(), e.at_ms // 2000)
        if key in seen:
            continue
        seen.add(key)
        sugg = e.payload.get("suggestion")
        if sugg is None and e.payload.get("suggestions"):
            sugg = ", ".join(e.payload["suggestions"])
        items.append(CodeSwitchItem(text=text, atMs=e.at_ms, suggestion=sugg))
    return CodeSwitches(count=len(items), list=items[:100])


def turn_taking(utts: list[Utterance], events: list[Event]) -> TurnTaking:
    user = [u for u in utts if u.speaker == "human"]
    agent = [u for u in utts if u.speaker == "agent"]
    made = sum(1 for u in agent if u.interrupted) + sum(
        1
        for e in events
        if e.type == "interruption" and e.payload.get("by") == "user" and not e.payload.get("false")
    )
    received = sum(1 for u in user if u.interrupted)
    hints = sum(1 for e in events if e.type == "hint")
    return TurnTaking(
        userTurns=len(user),
        agentTurns=len(agent),
        avgUserTurnSec=round(sum(max(0, u.end_ms - u.start_ms) for u in user) / len(user) / 1000, 1)
        if user
        else 0.0,
        avgUserTurnWords=round(sum(len(tokenize(u.text)) for u in user) / len(user), 1)
        if user
        else 0.0,
        interruptionsMade=min(made, len(agent)),
        interruptionsReceived=received,
        hintsUsed=hints,
    )


def compute_deterministic(utts: list[Utterance], events: list[Event]) -> Deterministic:
    user_sec, agent_sec, share = speaking_time(utts)
    p, latency = pauses(utts)
    return Deterministic(
        speakingTimeSec=user_sec,
        agentSpeakingTimeSec=agent_sec,
        talkSharePct=share,
        wpm=wpm_overall(utts),
        wpmSeries=wpm_series(utts),
        pauses=p,
        meanResponseLatencyMs=latency,
        fillers=fillers(utts),
        repetitions=repetitions(utts),
        vocabulary=vocabulary(utts),
        sentences=sentences(utts),
        pronunciation=pronunciation(utts),
        codeSwitches=code_switches(events),
        turnTaking=turn_taking(utts, events),
    )


def hedging_ratio(utts: list[Utterance]) -> float:
    """Share of learner sentences containing hedges (used by the confidence index)."""
    sents = 0
    hedged = 0
    for u in utts:
        if u.speaker != "human":
            continue
        for s in re.split(r"(?<=[.!?])\s+", u.text):
            if not s.strip():
                continue
            sents += 1
            low = s.lower()
            if any(h in low for h in HEDGES):
                hedged += 1
    return round(hedged / sents, 3) if sents else 0.0
