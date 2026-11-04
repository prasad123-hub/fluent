import json
from pathlib import Path

import pytest

from fluent_agent.analysis import metrics as m
from fluent_agent.analysis import rubric
from fluent_agent.analysis.rubric import (
    Judgement,
    _openai_strict,
    judge,
    recommended_drills,
    scripted_judgement,
)
from fluent_agent.schemas import Scenario
from fluent_agent.settings import Settings

FIX = Path(__file__).parent / "fixtures"
SHARED = Path(__file__).resolve().parents[3] / "packages" / "shared" / "fixtures"


def scenario() -> Scenario:
    return Scenario.model_validate(json.loads((SHARED / "scenario.example.json").read_text()))


def utts() -> list[m.Utterance]:
    return [
        m.utterance_from_row(r) for r in json.loads((FIX / "utterances_interview.json").read_text())
    ]


def events() -> list[m.Event]:
    return [m.event_from_row(r) for r in json.loads((FIX / "events_interview.json").read_text())]


def settings(**over) -> Settings:
    base = {
        "DATABASE_URL": "postgresql://x",
        "LIVEKIT_URL": "ws://x",
        "LIVEKIT_API_KEY": "k",
        "LIVEKIT_API_SECRET": "s",
    }
    return Settings.model_validate({**base, **over})


def test_scripted_judgement_is_schema_valid_and_finds_rule_errors():
    det = m.compute_deterministic(utts(), events())
    j = scripted_judgement(scenario(), utts(), det)
    assert isinstance(j, Judgement)
    cats = [e.category for e in j.grammarErrors]
    assert "tense" in cats or "preposition" in cats
    assert any("myself" in e.quote.lower() for e in j.grammarErrors)
    assert j.judged.interview is not None and j.judged.ielts is None
    assert 0 <= j.judged.grammar.score <= 100
    assert len(j.taskCriteria) == len(scenario().successCriteria)
    assert j.summary and j.overallCefr in {"A1", "A2", "B1", "B2", "C1", "C2"}


def test_judgement_rejects_invalid_llm_output():
    bad = {"judged": {}, "summary": "x"}
    with pytest.raises(Exception):  # noqa: B017 - pydantic ValidationError subclass varies
        Judgement.model_validate(bad)


def test_openai_strict_schema_marks_all_objects():
    schema = _openai_strict(Judgement.model_json_schema())

    def check(node):
        if isinstance(node, dict):
            if node.get("type") == "object" and "properties" in node:
                assert node["additionalProperties"] is False
                assert set(node["required"]) == set(node["properties"].keys())
            for v in node.values():
                check(v)
        elif isinstance(node, list):
            for v in node:
                check(v)

    check(schema)


@pytest.mark.asyncio
async def test_judge_uses_mocked_provider_and_retries_once(monkeypatch):
    """Provider returns invalid JSON once, then a valid judgement — no network, no keys."""
    det = m.compute_deterministic(utts(), events())
    valid = scripted_judgement(scenario(), utts(), det).model_dump()
    calls = {"n": 0}

    async def fake_openai(s, prompt, schema, retry_note):
        calls["n"] += 1
        assert "TRANSCRIPT:" in prompt and "LEARNER:" in prompt
        if calls["n"] == 1:
            return "{not json", {"input_tokens": 10, "output_tokens": 1}
        return json.dumps(valid), {"input_tokens": 1200, "output_tokens": 800}

    monkeypatch.setattr(rubric, "_call_openai", fake_openai)
    s = settings(OPENAI_API_KEY="sk-test", FLUENT_FAKE_LLM="0")
    j, usage = await judge(s, scenario(), "gentle", utts(), det)
    assert calls["n"] == 2
    assert usage["output_tokens"] == 800
    assert j.judged.grammar.score == valid["judged"]["grammar"]["score"]


@pytest.mark.asyncio
async def test_judge_falls_back_to_scripted_without_keys():
    det = m.compute_deterministic(utts(), events())
    j, usage = await judge(settings(), scenario(), "gentle", utts(), det)
    assert usage == {"input_tokens": 0, "output_tokens": 0}
    assert j.summary


def test_recommended_drills_map_weaknesses():
    det = m.compute_deterministic(utts(), events())
    j = scripted_judgement(scenario(), utts(), det)
    drills = recommended_drills(scenario(), det, j)
    assert 1 <= len(drills) <= 3
    ids = {d.scenarioId for d in drills}
    assert ids & {
        "fluency-filler-elimination",
        "pron-v-vs-w",
        "pron-th-sounds",
        "fluency-vocabulary-upgrade",
        "fluency-60-second-talk",
        "fluency-paraphrase-challenge",
        scenario().id,
    }
