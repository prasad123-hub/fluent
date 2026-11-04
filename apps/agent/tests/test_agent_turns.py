"""Turn-level agent tests with the scripted LLM (no API keys). Pattern from livekit-agents docs/tests:
start an AgentSession, run one user turn, assert on the events it produced, then close the turn."""

import json
from pathlib import Path

import pytest
from livekit.agents import AgentSession

from fluent_agent.fake_llm import ScriptedLLM
from fluent_agent.main import FluentAgent, SessionConfig, SessionControl, wire_events
from fluent_agent.schemas import Character, Scenario, SessionDispatchMetadata
from fluent_agent.tracker import NullStore, SessionTracker

SHARED = Path(__file__).resolve().parents[3] / "packages" / "shared" / "fixtures"


def make_agent(
    mode: str = "gentle", scenario: Scenario | None = None
) -> tuple[FluentAgent, SessionControl]:
    sc = scenario or Scenario.model_validate(
        json.loads((SHARED / "scenario.example.json").read_text())
    )
    meta = SessionDispatchMetadata(
        sessionId="test", scenarioId=sc.id, coachingMode=mode, difficulty="B1"
    )  # type: ignore[arg-type]
    cfg = SessionConfig(meta=meta, scenario=sc, learner_name="Prasad")
    tracker = SessionTracker(NullStore(), "test")
    ctl = SessionControl(cfg=cfg, tracker=tracker, ctx=None)
    return FluentAgent(cfg, ctl), ctl


@pytest.mark.asyncio
async def test_greeting_uses_scenario_opening_line():
    agent, _ = make_agent()
    async with AgentSession(llm=ScriptedLLM()) as sess:
        result = await sess.start(agent, capture_run=True)
        result.expect.next_event().is_agent_handoff(new_agent_type=FluentAgent)
        ev = result.expect.next_event().is_message(role="assistant")
        assert "Meera" in (ev.event().item.text_content or "")
        result.expect.no_more_events()


@pytest.mark.asyncio
async def test_error_triggers_log_correction_tool_and_recast():
    agent, ctl = make_agent("gentle")
    ctl.tracker.start()
    async with AgentSession(llm=ScriptedLLM()) as sess:
        await sess.start(agent)
        result = await sess.run(
            user_input="I am working in Infosys since three years as a developer."
        )
        result.expect.skip_next_event_if(type="message", role="assistant")
        result.expect.next_event().is_function_call(
            name="log_correction", arguments={"category": "tense"}
        )
        result.expect.next_event().is_function_call_output(output="logged")
        result.expect.next_event().is_message(role="assistant")
        result.expect.no_more_events()
    await ctl.tracker.close()
    store = ctl.tracker.store
    assert isinstance(store, NullStore)
    assert any(
        e["type"] == "correction" and e["payload"]["corrected"] == "for three years"
        for e in store.events
    )


@pytest.mark.asyncio
async def test_help_request_calls_give_hint_with_scenario_phrase():
    agent, ctl = make_agent("active")
    ctl.tracker.start()
    async with AgentSession(llm=ScriptedLLM()) as sess:
        await sess.start(agent)
        result = await sess.run(user_input="Can you help me? What should I say?")
        result.expect.next_event().is_function_call(name="give_hint")
        out = result.expect.next_event().is_function_call_output()
        assert "Currently I'm working as" in (out.event().item.output or "")
        result.expect.next_event().is_message(role="assistant")
        result.expect.no_more_events()
    await ctl.tracker.close()
    assert ctl.tracker.hints_used == 1


@pytest.mark.asyncio
async def test_strict_mode_refuses_hints():
    agent, _ = make_agent("strict")
    async with AgentSession(llm=ScriptedLLM()) as sess:
        await sess.start(agent)
        result = await sess.run(user_input="Please help me, what should I say?")
        result.expect.next_event().is_function_call(name="give_hint")
        out = result.expect.next_event().is_function_call_output(is_error=True)
        assert "exam mode" in (out.event().item.output or "")
        reply = result.expect.next_event().is_message(role="assistant")
        assert "exam mode" in (reply.event().item.text_content or "").lower()
        result.expect.no_more_events()


@pytest.mark.asyncio
async def test_hinglish_is_logged_from_lexicon_and_llm():
    agent, ctl = make_agent("gentle")
    ctl.tracker.start()
    async with AgentSession(llm=ScriptedLLM()) as sess:
        wire_events(sess, ctl)
        await sess.start(agent)
        result = await sess.run(user_input="Matlab I handle the payments module yaar.")
        result.expect.skip_next_event_if(type="message", role="assistant")
        result.expect.next_event().is_function_call(name="log_code_switch")
        result.expect.next_event().is_function_call_output(output="logged")
        result.expect.next_event().is_message(role="assistant")
        result.expect.no_more_events()
    await ctl.tracker.close()
    store = ctl.tracker.store
    assert isinstance(store, NullStore)
    sources = {e["payload"].get("source") for e in store.events if e["type"] == "code_switch"}
    assert sources == {"lexicon", "llm"}


@pytest.mark.asyncio
async def test_switch_persona_changes_character_in_panel_scenario():
    sc = Scenario.model_validate(json.loads((SHARED / "scenario.example.json").read_text()))
    sc = sc.model_copy(
        update={
            "characters": [
                Character(
                    name="Thomas Mathew", role="risk manager", personality="dry", voice="oliver"
                )
            ]
        }
    )
    agent, ctl = make_agent("gentle", sc)
    async with AgentSession(llm=ScriptedLLM()) as sess:
        await sess.start(agent)
        result = await sess.run(user_input="Switch to Thomas Mathew")
        result.expect.next_event().is_function_call(name="switch_persona")
        result.expect.next_event().is_function_call_output()
        result.expect.next_event().is_message(role="assistant")
        result.expect.no_more_events()
    assert ctl.tracker.current_character == "Thomas Mathew"


@pytest.mark.asyncio
async def test_unknown_persona_is_a_tool_error():
    agent, _ = make_agent("gentle")
    async with AgentSession(llm=ScriptedLLM()) as sess:
        await sess.start(agent)
        result = await sess.run(user_input="Switch to Nobody Here")
        result.expect.next_event().is_function_call(name="switch_persona")
        result.expect.next_event().is_function_call_output(is_error=True)
        result.expect.next_event().is_message(role="assistant")


@pytest.mark.asyncio
async def test_drill_scores_are_tallied():
    agent, ctl = make_agent("drill")
    async with AgentSession(llm=ScriptedLLM()) as sess:
        await sess.start(agent)
        result = await sess.run(user_input="ship sheep ship sheep")
        result.expect.next_event().is_function_call(
            name="score_drill_attempt", arguments={"score": 7}
        )
        result.expect.next_event().is_function_call_output()
        result.expect.next_event().is_message(role="assistant")
    assert ctl.drill_scores == [7]


@pytest.mark.asyncio
async def test_end_session_tool_records_summary_and_requests_close():
    agent, ctl = make_agent("gentle")
    ctl.tracker.start()
    async with AgentSession(llm=ScriptedLLM()) as sess:
        await sess.start(agent)
        result = await sess.run(user_input="Thank you, let's stop here. Goodbye.")
        result.expect.next_event().is_function_call(name="end_session_with_summary")
        result.expect.next_event().is_function_call_output()
        result.expect.next_event().is_message(role="assistant")
        assert ctl.ending is True and ctl.end_reason == "agent_ended"
    await ctl.tracker.close()
