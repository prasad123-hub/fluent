"""Composite scores: 8 core skills, overall 0–100, CEFR, confidence index. Formula documented in docs/SCORING.md."""

from __future__ import annotations

from ..schemas import Cefr, Skills
from .metrics import Deterministic, Utterance, hedging_ratio
from .rubric import Judgement

WEIGHTS: dict[str, float] = {
    "grammar": 0.18,
    "vocabulary": 0.14,
    "fluency": 0.18,
    "pronunciation": 0.12,
    "coherence": 0.10,
    "taskAchievement": 0.12,
    "communication": 0.10,
    "confidence": 0.06,
}

CEFR_ORDER: list[Cefr] = ["A1", "A2", "B1", "B2", "C1", "C2"]


def clamp(v: float) -> float:
    return float(max(0.0, min(100.0, round(v, 1))))


def fluency_score(det: Deterministic, judged_fluency: float) -> float:
    """Blend the judge's fluency with deterministic pace/filler/pause evidence (50/50)."""
    pace = 100 - min(60, abs(det.wpm - 140) * 0.8) if det.wpm else 50
    filler_pen = min(45, det.fillers.per100Words * 4.5)
    pause_pen = min(30, det.pauses.over1500ms * 2 + det.pauses.over3000ms * 4)
    det_score = clamp(0.5 * pace + 0.5 * (100 - filler_pen - pause_pen))
    return clamp(0.5 * judged_fluency + 0.5 * det_score)


def pronunciation_score(det: Deterministic, judged: float) -> float:
    conf = det.pronunciation.meanConfidence
    det_score = (
        clamp(conf * 100 - min(20, len(det.pronunciation.lowConfidenceWords) * 0.8))
        if conf
        else judged
    )
    return clamp(0.6 * judged + 0.4 * det_score)


def coherence_score(det: Deterministic, j: Judgement) -> float:
    linking = min(15, det.sentences.pctComplex * 0.4)
    base = 0.6 * j.judged.fluency.score + 0.4 * j.judged.communication.structure
    return clamp(base + linking - min(10, det.repetitions.count * 1.0))


def confidence_index(det: Deterministic, j: Judgement, utts: list[Utterance]) -> float:
    hedging = hedging_ratio(utts)
    latency_pen = min(20, max(0, det.meanResponseLatencyMs - 1500) / 150)
    share_bonus = 10 if 45 <= det.talkSharePct <= 70 else 0
    return clamp(
        0.4 * j.judged.communication.hedging
        + 0.3 * j.judged.communication.assertiveness
        + 30
        - hedging * 40
        - latency_pen
        - min(15, det.fillers.per100Words * 1.5)
        + share_bonus
    )


def compute_skills(det: Deterministic, j: Judgement, utts: list[Utterance]) -> Skills:
    return Skills(
        grammar=clamp(j.judged.grammar.score),
        vocabulary=clamp(
            0.7 * j.judged.vocabulary.score + 0.3 * (40 + (100 - det.vocabulary.pctTop2k) * 1.5)
        ),
        fluency=fluency_score(det, j.judged.fluency.score),
        pronunciation=pronunciation_score(det, j.judged.pronunciation.score),
        coherence=coherence_score(det, j),
        taskAchievement=clamp(j.judged.taskAchievement.score),
        communication=clamp(j.judged.communication.score),
        confidence=confidence_index(det, j, utts),
    )


def overall_score(skills: Skills) -> float:
    s = skills.model_dump()
    return clamp(sum(s[k] * w for k, w in WEIGHTS.items()))


def cefr_from_score(score: float, judged: Cefr) -> Cefr:
    """Score-derived band, nudged at most one step towards the judge's overall CEFR."""
    bands: list[tuple[float, Cefr]] = [
        (88, "C2"),
        (76, "C1"),
        (62, "B2"),
        (46, "B1"),
        (28, "A2"),
        (0, "A1"),
    ]
    derived = next(b for t, b in bands if score >= t)
    di, ji = CEFR_ORDER.index(derived), CEFR_ORDER.index(judged)
    if ji > di:
        return CEFR_ORDER[di + 1]
    if ji < di:
        return CEFR_ORDER[di - 1]
    return derived


def code_switch_penalty(det: Deterministic) -> float:
    """Up to −6 overall points for heavy Hinglish use (never shames; small nudge)."""
    return min(6.0, det.codeSwitches.count * 1.0)
