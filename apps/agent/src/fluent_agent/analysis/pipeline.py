"""End-of-session analysis pipeline: load → deterministic metrics → judge → compose → persist.

Idempotent per session (report upsert, child rows replaced). Marks the session `complete` or
`failed` (with a visible reason); the web app offers "Retry analysis" on failure.
"""

from __future__ import annotations

import json
import time
from typing import Any, cast

from ..db import Database
from ..log import get_logger
from ..schemas import AnalysisReport, GrammarCategory, GrammarError, Scenario
from ..settings import Settings
from .metrics import Event, Utterance, compute_deterministic, event_from_row, utterance_from_row
from .profile import compute_deltas, update_profile
from .rubric import judge, recommended_drills
from .scoring import cefr_from_score, code_switch_penalty, compute_skills, overall_score

log = get_logger("analysis")

MIN_LEARNER_WORDS = 15
_CATEGORIES = {
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


def _category(v: Any) -> GrammarCategory:
    return cast(GrammarCategory, v if v in _CATEGORIES else "other")


async def analyze_session(db: Database, session_id: str, s: Settings) -> AnalysisReport | None:
    t0 = time.time()
    sess = await db.get_session(session_id)
    if sess is None:
        log.warning("analysis.no_session", session_id=session_id)
        return None
    try:
        scenario = await _load_scenario(db, sess)
        utt_rows = await db.list_utterances(session_id)
        ev_rows = await db.list_events(session_id)
        utts = [utterance_from_row(r) for r in utt_rows]
        events = [event_from_row(r) for r in ev_rows]
        learner_words = sum(len(u.text.split()) for u in utts if u.speaker == "human")
        if learner_words < MIN_LEARNER_WORDS:
            await db.set_session_status(
                session_id,
                "failed",
                failureReason=f"Too little speech to analyse ({learner_words} words). Try a longer session.",
            )
            log.info("analysis.too_short", words=learner_words)
            return None

        report = await build_report(db, s, sess, scenario, utts, events)
        await persist_report(db, sess, report, events)
        await db.set_session_status(session_id, "complete")
        log.info(
            "analysis.complete",
            overall=report.overall,
            cefr=report.cefr,
            ms=round((time.time() - t0) * 1000),
        )
        return report
    except Exception as e:  # noqa: BLE001
        log.error("analysis.failed", error=str(e)[:500])
        await db.set_session_status(
            session_id, "failed", failureReason=f"Analysis error: {str(e)[:180]}"
        )
        return None


async def _load_scenario(db: Database, sess: dict[str, Any]) -> Scenario:
    from ..main import scenario_from_row

    if sess.get("customScenario"):
        raw = sess["customScenario"]
        return Scenario.model_validate(json.loads(raw) if isinstance(raw, str) else raw)
    row = await db.get_scenario(sess["scenarioId"]) if sess.get("scenarioId") else None
    if row is None:
        raise RuntimeError("scenario not found for session")
    return scenario_from_row(row)


async def build_report(
    db: Database,
    s: Settings,
    sess: dict[str, Any],
    scenario: Scenario,
    utts: list[Utterance],
    events: list[Event],
) -> AnalysisReport:
    det = compute_deterministic(utts, events)
    j, usage = await judge(s, scenario, str(sess.get("coachingMode") or "gentle"), utts, det)
    if usage.get("input_tokens") or usage.get("output_tokens"):
        await db.insert_usage(
            sess["id"],
            provider=s.analysis_provider,
            kind="analysis",
            model=s.analysis_model,
            input_tokens=usage["input_tokens"],
            output_tokens=usage["output_tokens"],
            cost_usd=round(
                usage["input_tokens"] / 1e6 * 2.0 + usage["output_tokens"] / 1e6 * 8.0, 5
            ),
        )
    skills = compute_skills(det, j, utts)
    overall = max(0.0, round(overall_score(skills) - code_switch_penalty(det), 1))
    cefr = cefr_from_score(overall, j.overallCefr)
    previous = await db.previous_reports(sess["userId"], exclude_session=sess["id"], limit=5)
    # tool-logged corrections the judge may have missed become low-severity errors
    logged = [
        e.payload
        for e in events
        if e.type == "correction" and e.payload.get("original") and e.payload.get("corrected")
    ]
    seen = {g.quote.lower() for g in j.grammarErrors}
    extra: list[GrammarError] = []
    for p in logged:
        if str(p["original"]).lower() in seen:
            continue
        seen.add(str(p["original"]).lower())
        extra.append(
            GrammarError(
                quote=str(p["original"])[:200],
                correction=str(p["corrected"])[:200],
                category=_category(p.get("category")),
                explanation=str(p.get("explanation") or "Noted by the coach during the session.")[
                    :200
                ],
                severity=1,
                atMs=None,
            )
        )
    report = AnalysisReport(
        sessionId=sess["id"],
        overall=overall,
        cefr=cefr,
        confidenceIndex=skills.confidence,
        skills=skills,
        deterministic=det,
        judged=j.judged,
        grammarErrors=[*j.grammarErrors, *extra][:60],
        rewrites=j.rewrites,
        strengths=j.strengths,
        priorities=j.priorities,
        taskCriteria=j.taskCriteria,
        recommendedDrills=recommended_drills(scenario, det, j),
        vocabBank=j.vocabBank,
        summary=j.summary,
        deltas=None,
    )
    report.deltas = compute_deltas(report, previous)
    return report


async def persist_report(
    db: Database, sess: dict[str, Any], report: AnalysisReport, events: list[Event]
) -> None:
    await db.upsert_report(report)
    det = report.deterministic
    points: dict[str, float] = {
        "overall": report.overall,
        **{f"skill.{k}": v for k, v in report.skills.model_dump().items()},
        "wpm": det.wpm,
        "fillersPer100": det.fillers.per100Words,
        "longPauses": float(det.pauses.over1500ms),
        "responseLatencyMs": det.meanResponseLatencyMs,
        "talkSharePct": det.talkSharePct,
        "vocabBeyond2kPct": round(100 - det.vocabulary.pctTop2k, 1),
        "codeSwitches": float(det.codeSwitches.count),
        "speakingTimeSec": det.speakingTimeSec,
        "confidence": report.confidenceIndex,
    }
    await db.replace_metric_points(sess["id"], points, at=sess.get("endedAt"))
    await db.replace_grammar_errors(sess["id"], [g.model_dump() for g in report.grammarErrors])
    await db.upsert_vocab(sess["userId"], sess["id"], [v.model_dump() for v in report.vocabBank])
    prev_profile = await db.get_profile(sess["userId"])
    minutes = float(sess.get("durationSec") or det.speakingTimeSec + det.agentSpeakingTimeSec) / 60
    new_profile = update_profile(prev_profile, report, session_minutes=round(minutes, 1))
    await db.upsert_profile(sess["userId"], new_profile)
