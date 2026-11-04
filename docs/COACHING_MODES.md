# Coaching modes — behaviour and verification

Fluent's five coaching modes change **what the agent is told to do** (prompt blocks appended by
`apps/agent/src/fluent_agent/prompt.py`) and **what the code allows** (e.g. `give_hint` refuses in
Strict mode regardless of what the model wants). Both layers are listed here, with transcripts.

| Mode | Prompt behaviour | Code-enforced behaviour |
|---|---|---|
| **Immersive** | Never breaks character, never corrects aloud; `log_correction` is called silently; Hinglish is answered naturally in English. | Corrections still reach the report via tool events; lexicon code-switch events are logged without any prompt nudge. |
| **Gentle** | Stays in character and *recasts* the error naturally ("Oh, you've been working there for three years?") and logs it; offers the English phrase once when Hindi is used. | On lexicon code-switch the agent receives a one-turn system note to offer the English phrasing. |
| **Active Coach** | One-line tip at natural pauses, then resumes; max one tip per turn; praises good phrases via `log_good_phrase`. | Same code-switch nudge as Gentle; silence prompts call `give_hint`. |
| **Strict / Exam** | Formal register, no help, no commentary; band estimate at the end. | `give_hint` raises `ToolError("Hints are not available in exam mode…")`; silence handling repeats the question instead of hinting; timer is strict. |
| **Drill** | Rapid prompts; `score_drill_attempt` after every attempt; running tally. | Scores are clamped 1–10, tallied in `SessionControl.drill_scores` and logged as `drill_score` events for the report. |

Exact prompt blocks: `COACHING_BLOCKS` in `apps/agent/src/fluent_agent/prompt.py`
(unit-tested in `apps/agent/tests/test_prompt.py`: all five produce distinct instructions).

## How these transcripts were produced

`lk agent debugger` (text mode) against the local agent with the **scripted LLM**
(`FLUENT_FAKE_LLM=1`, no API keys in the build sandbox). The scripted model proves the plumbing —
greeting, tool selection, tool outputs, code-enforced refusals, persona switching — but it does not
vary its wording by coaching mode the way a real model does. Re-run
`scratchpad: lk agent debugger start` with `OPENAI_API_KEY` set to see mode-specific phrasing.
Command used per mode: `FLUENT_DEBUG_SCENARIO=<id> FLUENT_DEBUG_MODE=<mode> lk agent debugger start`,
then `lk agent debugger say "…"`.

Silence handling (6 s → gentle prompt, 20 s → hint, 120 s away → end) was observed live in the
Practice page: the agent said "Take your time. Shall I rephrase the question?" after six seconds of
silence (see `docs/screenshots/practice-live-dark-390.png`).

### immersive

scenario=interview-hr-screening mode=immersive

```

  ● agent: fluent_agent

  ● Agent
    Hi, this is Meera from Zephyr Labs. Thanks for taking the call. Is this a good time? Great. To start, could you tell me a little about yourself?


  ● You
    Myself Prasad, I am working in Infosys since three years as backend developer.

  ● Agent
    Oh, Myself Prasad, I am working in Infosys for three years as backend developer? Nice. And what do you enjoy most about that?

  ● tool: log_correction({"original": "since three years", "corrected": "for three years", "category": "tense", "explanation": "Use 'for' with a duration; 'since' takes a point in time."})
    ↳ logged

  ● Agent
    Got it. Let's continue — tell me more.


  ● You
    Matlab I handle the payments module yaar.

  ● Agent
    I think you mean 'I mean' — could you try saying that in English?

  ● tool: log_code_switch({"text": "Matlab", "suggestion": "I mean"})
    ↳ logged

  ● Agent
    Got it. Let's continue — tell me more.


  ● You
    Can you help me? What should I say?

  ● tool: give_hint()
    ↳ hint: You could say something like: 'I'm currently a backend developer at Infosys, where I've spent three years on a banking platform.'. Suggest it briefly, then ask your question again.

  ● Agent
    You could say something like: 'I'm currently a backend developer at Infosys, where I've spent three years on a banking platform.'. Suggest it briefly, then ask your question again.

Session ended. 3 turn(s) over 3s, ending with agent "fluent_agent".
```

### gentle

scenario=interview-hr-screening mode=gentle

```

  ● agent: fluent_agent

  ● Agent
    Hi, this is Meera from Zephyr Labs. Thanks for taking the call. Is this a good time? Great. To start, could you tell me a little about yourself?


  ● You
    Myself Prasad, I am working in Infosys since three years as backend developer.

  ● Agent
    Oh, Myself Prasad, I am working in Infosys for three years as backend developer? Nice. And what do you enjoy most about that?

  ● tool: log_correction({"original": "since three years", "corrected": "for three years", "category": "tense", "explanation": "Use 'for' with a duration; 'since' takes a point in time."})
    ↳ logged

  ● Agent
    Got it. Let's continue — tell me more.


  ● You
    Matlab I handle the payments module yaar.

  ● Agent
    I think you mean 'I mean' — could you try saying that in English?

  ● tool: log_code_switch({"text": "Matlab", "suggestion": "I mean"})
    ↳ logged

  ● Agent
    Got it. Let's continue — tell me more.


  ● You
    Can you help me? What should I say?

  ● tool: give_hint()
    ↳ hint: You could say something like: 'I'm currently a backend developer at Infosys, where I've spent three years on a banking platform.'. Suggest it briefly, then ask your question again.

  ● Agent
    You could say something like: 'I'm currently a backend developer at Infosys, where I've spent three years on a banking platform.'. Suggest it briefly, then ask your question again.

Session ended. 3 turn(s) over 3s, ending with agent "fluent_agent".
```

### active

scenario=interview-hr-screening mode=active

```

  ● agent: fluent_agent

  ● Agent
    Hi, this is Meera from Zephyr Labs. Thanks for taking the call. Is this a good time? Great. To start, could you tell me a little about yourself?


  ● You
    Myself Prasad, I am working in Infosys since three years as backend developer.

  ● Agent
    Oh, Myself Prasad, I am working in Infosys for three years as backend developer? Nice. And what do you enjoy most about that?

  ● tool: log_correction({"original": "since three years", "corrected": "for three years", "category": "tense", "explanation": "Use 'for' with a duration; 'since' takes a point in time."})
    ↳ logged

  ● Agent
    Got it. Let's continue — tell me more.


  ● You
    Matlab I handle the payments module yaar.

  ● Agent
    I think you mean 'I mean' — could you try saying that in English?

  ● tool: log_code_switch({"text": "Matlab", "suggestion": "I mean"})
    ↳ logged

  ● Agent
    Got it. Let's continue — tell me more.


  ● You
    Can you help me? What should I say?

  ● tool: give_hint()
    ↳ hint: You could say something like: 'I'm currently a backend developer at Infosys, where I've spent three years on a banking platform.'. Suggest it briefly, then ask your question again.

  ● Agent
    You could say something like: 'I'm currently a backend developer at Infosys, where I've spent three years on a banking platform.'. Suggest it briefly, then ask your question again.

Session ended. 3 turn(s) over 3s, ending with agent "fluent_agent".
```

### strict

scenario=exam-ielts-speaking-part1 mode=strict

```

  ● agent: fluent_agent

  ● Agent
    Good morning. My name is Jonathan Reed. Could you tell me your full name, please?


  ● You
    I am working in Infosys since three years.

  ● Agent
    Oh, I am working in Infosys for three years? Nice. And what do you enjoy most about that?

  ● tool: log_correction({"original": "since three years", "corrected": "for three years", "category": "tense", "explanation": "Use 'for' with a duration; 'since' takes a point in time."})
    ↳ logged

  ● Agent
    Got it. Let's continue — tell me more.


  ● You
    Can you help me? What should I say?

  ● tool: give_hint()
    ✗ Hints are not available in exam mode. Tell the learner to try their best.

  ● Agent
    I'm sorry, hints aren't available in exam mode. Please answer as best you can.


  ● You
    Next question please.

  ● tool: next_interview_question()
    ↳ question 1 of 7: tell me about yourself

  ● Agent
    Next question. Tell me about yourself?

Session ended. 3 turn(s) over 2s, ending with agent "fluent_agent".
```

### drill

scenario=pron-ee-vs-i mode=drill

```

  ● agent: fluent_agent

  ● Agent
    Today we're fixing one tiny sound that changes meaning: ship versus sheep. Say after me: ship. Now: sheep. Hear it? Let's drill.


  ● You
    ship sheep ship sheep

  ● tool: score_drill_attempt({"score": 7, "feedback": "Clear, but the vowel in 'sheep' needs to be longer."})
    ↳ recorded 7/10 (attempt 1, running average 7.0)

  ● Agent
    That's 7 out of 10. Watch the vowel length — try it once more, then we move on.


  ● You
    very good ship and sheep

  ● tool: score_drill_attempt({"score": 7, "feedback": "Clear, but the vowel in 'sheep' needs to be longer."})
    ↳ recorded 7/10 (attempt 2, running average 7.0)

  ● Agent
    That's 7 out of 10. Watch the vowel length — try it once more, then we move on.

Session ended. 2 turn(s) over 3s, ending with agent "fluent_agent".
```

### panel

scenario=interview-panel-mock mode=gentle

```

  ● agent: fluent_agent

  ● Agent
    Good morning, and welcome. I'm Devika Rao, head of digital banking, and with me is Thomas Mathew from risk. We'll take turns asking questions. Devika here: let's start with your background in two minutes.


  ● You
    Hello, I am Prasad, happy to be here.

  ● Agent
    That's really interesting. Why did you choose that path, and what did you learn from it?


  ● You
    Switch to Thomas Mathew

  ● tool: switch_persona({"name": "thomas mathew"})
    ↳ now speaking as Thomas Mathew (senior risk manager, second interviewer). Announce the speaker by name.

  ● Agent
    Thomas Mathew here — thanks. Let me pick up from there: what would you say your biggest strength is?


  ● You
    What does stakeholder mean?

  ● tool: lookup_word({"word": "stakeholder"})
    ↳ No dictionary entry stored. Define 'stakeholder' in one simple sentence, say how it is pronounced in plain words, and give one example sentence.

  ● Agent
    Sure — a stakeholder is someone with an interest in how a project turns out, like your manager or a client. For example: I aligned the stakeholders before the launch.


  ● You
    Please slow down a little.

  ● Agent
    Of course, I'll slow down a little.

  ● tool: change_tts_speed({"rate": 0.85})
    ↳ this voice cannot change speed; speak in shorter, simpler sentences instead

  ● Agent
    Of course, I'll slow down a little.

Session ended. 4 turn(s) over 3s, ending with agent "fluent_agent".
```

