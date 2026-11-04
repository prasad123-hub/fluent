"""The Pydantic mirrors must accept the shared fixtures (contract with the web app)."""

import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from fluent_agent.schemas import AnalysisReport, Scenario, SessionDispatchMetadata

FIXTURES = Path(__file__).resolve().parents[3] / "packages" / "shared" / "fixtures"


def test_scenario_fixture_validates() -> None:
    data = json.loads((FIXTURES / "scenario.example.json").read_text())
    s = Scenario.model_validate(data)
    assert s.agentPersona.name == "Meera Iyer"
    assert s.model_dump(exclude_none=True) == data


def test_analysis_report_fixture_validates() -> None:
    data = json.loads((FIXTURES / "analysis-report.example.json").read_text())
    r = AnalysisReport.model_validate(data)
    assert r.overall == 74
    assert r.judged.interview is not None
    assert r.judged.ielts is None


def test_report_rejects_unknown_fields() -> None:
    data = json.loads((FIXTURES / "analysis-report.example.json").read_text())
    data["bogus"] = 1
    with pytest.raises(ValidationError):
        AnalysisReport.model_validate(data)


def test_dispatch_metadata_defaults() -> None:
    m = SessionDispatchMetadata.model_validate({"sessionId": "s1", "scenarioId": "x"})
    assert m.coachingMode == "gentle" and m.difficulty == "B1" and m.durationMin is None
