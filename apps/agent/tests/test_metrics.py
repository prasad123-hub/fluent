import json
from pathlib import Path

import pytest

from fluent_agent.analysis import metrics as m

FIX = Path(__file__).parent / "fixtures"


@pytest.fixture
def utts() -> list[m.Utterance]:
    return [
        m.utterance_from_row(r) for r in json.loads((FIX / "utterances_interview.json").read_text())
    ]


@pytest.fixture
def events() -> list[m.Event]:
    return [m.event_from_row(r) for r in json.loads((FIX / "events_interview.json").read_text())]


def test_speaking_time_and_share(utts):
    user, agent, share = m.speaking_time(utts)
    assert user == pytest.approx(18.6, abs=0.1)  # 8.6 + 10.0
    assert agent == pytest.approx(6.7, abs=0.1)
    assert 70 < share < 76


def test_wpm_overall_and_series(utts):
    wpm = m.wpm_overall(utts)
    assert 130 < wpm < 170  # 46 words / 18.6 s
    series = m.wpm_series(utts)
    assert [p.minute for p in series] == [0]
    assert series[0].wpm == pytest.approx(wpm, abs=5)


def test_pauses_and_latency(utts):
    p, latency = m.pauses(utts)
    # gaps: 6800→8600 (1.8s), 20500→22200 (1.7s), 23800→24800 (1.0s), 26000→26800 (0.8s)
    assert p.over500ms == 4
    assert p.over1500ms == 2
    assert p.over3000ms == 0
    assert p.totalPauseSec == pytest.approx(5.3, abs=0.1)
    assert latency == pytest.approx(1350, abs=1)  # (5400-4200 + 19000-17500)/2


def test_fillers_counts_indian_english_and_standard(utts):
    f = m.fillers(utts)
    assert f.byWord.get("um") == 1
    assert f.byWord.get("basically") == 1
    assert "because" not in f.byWord
    assert f.total == 2
    assert 3 < f.per100Words < 6
    assert all(h.atMs >= 5400 for h in f.hits)


def test_fillers_text_only_fallback():
    u = m.Utterance("human", "So um I only, you know, basically did it only", 0, 5000)
    f = m.fillers([u])
    assert f.byWord["um"] == 1 and f.byWord["you know"] == 1 and f.byWord["basically"] == 1
    assert f.byWord.get("so") == 1  # turn-initial 'so'
    assert f.byWord.get("only") == 1  # sentence-final emphatic 'only'


def test_repetitions_and_self_corrections():
    u = m.Utterance(
        "human", "I I was was working there, sorry, I mean I was managing the the team", 0, 6000
    )
    r = m.repetitions([u])
    assert r.count >= 3
    assert r.selfCorrections == 2


def test_vocabulary_stats(utts):
    v = m.vocabulary(utts)
    assert v.totalWords == 48
    assert v.uniqueWords < v.totalWords
    assert 0 < v.ttr <= 1 and 0 < v.mattr <= 1
    assert v.pctTop1k < v.pctTop2k <= v.pctTop5k <= 100
    assert v.estimatedLevel in {"A2", "B1", "B2", "C1"}
    assert True


def test_mattr_window():
    toks = ["a", "b", "c", "d"] * 30
    assert m.mattr(toks, window=50) < 0.1
    assert m.mattr(["x", "y", "z"]) == 1.0


def test_sentence_stats(utts):
    s = m.sentences(utts)
    assert s.count == 6
    assert s.pctQuestions == pytest.approx(16.7, abs=0.1)
    assert s.pctComplex > 0
    assert s.avgLength > 5


def test_pronunciation_flags(utts):
    p = m.pronunciation(utts)
    assert 0.85 < p.meanConfidence < 0.95
    low = {w.word for w in p.lowConfidenceWords}
    assert {"three", "very", "think", "zephyr"} <= low
    phon = {f.phoneme: f.words for f in p.l1Flags}
    assert "v/w" in phon and "very" in phon["v/w"]
    assert "th" in phon and "three" in phon["th"]
    assert sum(b.count for b in p.confidenceHistogram) == 48


def test_code_switches_dedupes_lexicon_and_llm(events):
    cs = m.code_switches(events)
    assert cs.count == 1
    assert cs.list[0].text == "matlab" and cs.list[0].suggestion == "I mean"


def test_turn_taking(utts, events):
    t = m.turn_taking(utts, events)
    assert t.userTurns == 2 and t.agentTurns == 2
    assert t.interruptionsMade == 2  # interrupted agent utterance + user interruption event
    assert t.hintsUsed == 1
    assert t.avgUserTurnWords == 24


def test_compute_deterministic_validates_schema(utts, events):
    det = m.compute_deterministic(utts, events)
    assert det.model_dump()["wpm"] == det.wpm
    assert det.turnTaking.userTurns == 2
    assert m.hedging_ratio(utts) > 0
