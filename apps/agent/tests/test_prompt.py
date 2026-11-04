import json
from pathlib import Path

from fluent_agent.prompt import build_instructions, fill_template
from fluent_agent.schemas import Scenario

FIXTURE = (
    Path(__file__).resolve().parents[3]
    / "packages"
    / "shared"
    / "fixtures"
    / "scenario.example.json"
)


def scenario() -> Scenario:
    return Scenario.model_validate(json.loads(FIXTURE.read_text()))


def test_template_placeholders_are_filled() -> None:
    s = scenario()
    out = fill_template(s.systemPromptTemplate, s, "Prasad", "B1", 10)
    assert "{{" not in out
    assert "Meera Iyer" in out and "HR recruiter" in out


def test_coaching_modes_change_instructions() -> None:
    s = scenario()
    texts = {
        m: build_instructions(
            scenario=s,
            learner_name="Prasad",
            difficulty="B1",
            coaching_mode=m,
            duration_min=10,
            profile=None,
        )
        for m in ("immersive", "gentle", "active", "strict", "drill")
    }
    assert "never break character" in texts["immersive"]
    assert "implicit recast" in texts["gentle"]
    assert "ONE-LINE correction" in texts["active"]
    assert "no hints" in texts["strict"]
    assert "score_drill_attempt" in texts["drill"]
    assert len({t for t in texts.values()}) == 5


def test_profile_and_difficulty_are_injected() -> None:
    s = scenario()
    out = build_instructions(
        scenario=s,
        learner_name="Prasad",
        difficulty="C1",
        coaching_mode="gentle",
        duration_min=None,
        profile={
            "cefr": "B2",
            "recurringErrors": {"article": 7, "tense": 3},
            "fillerTrend": [{"at": "x", "per100": 6.2}],
            "weakPhonemes": ["v/w"],
        },
    )
    assert "LEVEL C1" in out
    assert "article (7)" in out and "v/w" in out and "filler words" in out
    assert "open-ended" in out
