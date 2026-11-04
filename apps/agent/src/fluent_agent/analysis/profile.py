"""Learner profile update after each analysed session (pure function + DB writer)."""

from __future__ import annotations

from datetime import UTC, date, datetime, timedelta
from typing import Any

from ..schemas import AnalysisReport

ALPHA = 0.3  # EMA weight for rolling metrics


def _ema(prev: float | None, new: float) -> float:
    return round(new if prev is None else (1 - ALPHA) * prev + ALPHA * new, 2)


def update_profile(
    prev: dict[str, Any] | None,
    report: AnalysisReport,
    *,
    session_minutes: float,
    today: date | None = None,
) -> dict[str, Any]:
    """Returns the full new profile dict (JSON-safe) merging `prev` with this report."""
    today = today or datetime.now(UTC).date()
    prev = prev or {}
    rolling: dict[str, float] = dict(prev.get("rollingMetrics") or {})
    det = report.deterministic
    new_metrics = {
        "overall": report.overall,
        **{f"skill.{k}": v for k, v in report.skills.model_dump().items()},
        "wpm": det.wpm,
        "fillersPer100": det.fillers.per100Words,
        "longPauses": float(det.pauses.over1500ms),
        "responseLatencyMs": det.meanResponseLatencyMs,
        "talkSharePct": det.talkSharePct,
        "vocabBeyond2kPct": round(100 - det.vocabulary.pctTop2k, 1),
        "codeSwitches": float(det.codeSwitches.count),
    }
    for k, v in new_metrics.items():
        rolling[k] = _ema(rolling.get(k), float(v))

    recurring: dict[str, int] = dict(prev.get("recurringErrors") or {})
    for e in report.grammarErrors:
        recurring[e.category] = int(recurring.get(e.category, 0)) + 1

    filler_trend = list(prev.get("fillerTrend") or [])[-59:] + [
        {"at": today.isoformat(), "per100": det.fillers.per100Words}
    ]
    vocab_trend = list(prev.get("vocabTrend") or [])[-59:] + [
        {
            "at": today.isoformat(),
            "level": det.vocabulary.estimatedLevel,
            "beyond2k": round(100 - det.vocabulary.pctTop2k, 1),
        }
    ]

    weak = list(prev.get("weakPhonemes") or [])
    for f in det.pronunciation.l1Flags:
        if len(f.words) >= 2 and f.phoneme not in weak:
            weak.append(f.phoneme)
    weak = weak[:6]

    last = prev.get("lastPracticedOn")
    last_date = date.fromisoformat(str(last)[:10]) if last else None
    streak = int(prev.get("streakDays") or 0)
    if last_date == today:
        pass
    elif last_date == today - timedelta(days=1):
        streak += 1
    else:
        streak = 1

    return {
        "cefr": report.cefr,
        "overallScore": round(rolling["overall"], 1),
        "confidenceIndex": round(_ema(prev.get("confidenceIndex"), report.confidenceIndex), 1),
        "rollingMetrics": rolling,
        "recurringErrors": recurring,
        "fillerTrend": filler_trend,
        "vocabTrend": vocab_trend,
        "weakPhonemes": weak,
        "strengths": [s.model_dump() for s in report.strengths],
        "priorities": [p.model_dump() for p in report.priorities],
        "streakDays": streak,
        "lastPracticedOn": today.isoformat(),
        "totalMinutesSpoken": round(
            float(prev.get("totalMinutesSpoken") or 0) + session_minutes, 1
        ),
        "totalSessions": int(prev.get("totalSessions") or 0) + 1,
    }


def compute_deltas(
    report: AnalysisReport, previous: list[dict[str, Any]]
) -> dict[str, float] | None:
    """Deltas vs the mean of up to 5 previous reports' key metrics (JSON dicts from the DB)."""
    if not previous:
        return None

    def mean(key: str, fn: Any) -> float | None:
        vals = []
        for r in previous:
            try:
                vals.append(float(fn(r)))
            except (KeyError, TypeError, ValueError):
                continue
        return sum(vals) / len(vals) if vals else None

    det = report.deterministic
    current: dict[str, float] = {
        "overall": report.overall,
        **{k: v for k, v in report.skills.model_dump().items()},
        "wpm": det.wpm,
        "fillersPer100": det.fillers.per100Words,
        "longPauses": float(det.pauses.over1500ms),
        "responseLatencyMs": det.meanResponseLatencyMs,
        "talkSharePct": det.talkSharePct,
    }
    getters: dict[str, Any] = {
        "overall": lambda r: r["overall"],
        "wpm": lambda r: r["metrics"]["deterministic"]["wpm"],
        "fillersPer100": lambda r: r["metrics"]["deterministic"]["fillers"]["per100Words"],
        "longPauses": lambda r: r["metrics"]["deterministic"]["pauses"]["over1500ms"],
        "responseLatencyMs": lambda r: r["metrics"]["deterministic"]["meanResponseLatencyMs"],
        "talkSharePct": lambda r: r["metrics"]["deterministic"]["talkSharePct"],
    }
    for k in report.skills.model_dump():
        getters[k] = lambda r, k=k: r["skills"][k]
    out: dict[str, float] = {}
    for k, v in current.items():
        m = mean(k, getters[k])
        if m is not None:
            out[k] = round(v - m, 1)
    return out
