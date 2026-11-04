import json
from pathlib import Path

from fluent_agent.analysis import metrics as m
from fluent_agent.analysis.profile import compute_deltas, update_profile
from fluent_agent.analysis.rubric import scripted_judgement
from fluent_agent.analysis.scoring import WEIGHTS, cefr_from_score, compute_skills, overall_score
from fluent_agent.schemas import AnalysisReport, Scenario

FIX = Path(__file__).parent / "fixtures"
SHARED = Path(__file__).resolve().parents[3] / "packages" / "shared" / "fixtures"


def _inputs():
    sc = Scenario.model_validate(json.loads((SHARED / "scenario.example.json").read_text()))
    utts = [
        m.utterance_from_row(r) for r in json.loads((FIX / "utterances_interview.json").read_text())
    ]
    events = [m.event_from_row(r) for r in json.loads((FIX / "events_interview.json").read_text())]
    det = m.compute_deterministic(utts, events)
    return sc, utts, det, scripted_judgement(sc, utts, det)


def test_weights_sum_to_one():
    assert abs(sum(WEIGHTS.values()) - 1.0) < 1e-9


def test_skills_and_overall_in_range():
    _, utts, det, j = _inputs()
    skills = compute_skills(det, j, utts)
    for v in skills.model_dump().values():
        assert 0 <= v <= 100
    o = overall_score(skills)
    assert 0 <= o <= 100


def test_cefr_nudges_at_most_one_step():
    assert cefr_from_score(70, "B2") == "B2"
    assert cefr_from_score(70, "C2") == "C1"  # one step up only
    assert cefr_from_score(70, "A1") == "B1"  # one step down only
    assert cefr_from_score(95, "C2") == "C2"


def test_profile_update_streak_and_rolling():
    report = AnalysisReport.model_validate(
        json.loads((SHARED / "analysis-report.example.json").read_text())
    )
    from datetime import date

    p1 = update_profile(None, report, session_minutes=9.5, today=date(2026, 11, 3))
    assert (
        p1["streakDays"] == 1 and p1["totalSessions"] == 1 and p1["rollingMetrics"]["overall"] == 74
    )
    p2 = update_profile(p1, report, session_minutes=5, today=date(2026, 11, 4))
    assert p2["streakDays"] == 2 and p2["totalMinutesSpoken"] == 14.5
    assert p2["recurringErrors"]["tense"] == 2
    p3 = update_profile(p2, report, session_minutes=5, today=date(2026, 11, 10))
    assert p3["streakDays"] == 1


def test_deltas_against_previous_reports():
    report = AnalysisReport.model_validate(
        json.loads((SHARED / "analysis-report.example.json").read_text())
    )
    prev = [
        {
            "overall": 70,
            "skills": report.skills.model_dump(),
            "metrics": {"deterministic": report.deterministic.model_dump()},
        }
    ]
    d = compute_deltas(report, prev)
    assert d is not None and d["overall"] == 4.0 and d["grammar"] == 0.0
    assert compute_deltas(report, []) is None
