"""Builds the agent's instructions from scenario + persona + difficulty + coaching mode + learner profile."""

from __future__ import annotations

from typing import Any

from .schemas import CoachingMode, Difficulty, Scenario

DIFFICULTY_BLOCKS: dict[Difficulty, str] = {
    "A2": (
        "LEVEL A2 (elementary): use everyday vocabulary and short sentences (max 12 words). Speak slowly and clearly. "
        "Ask simple, concrete questions. Scaffold a lot: offer two options when the learner is stuck. Move slowly."
    ),
    "B1": (
        "LEVEL B1 (intermediate): natural everyday English, sentences up to about 18 words. Some idioms are fine if clear from context. "
        "Ask open questions; occasionally ask a 'why' follow-up. Scaffold when the learner stalls."
    ),
    "B2": (
        "LEVEL B2 (upper-intermediate): fluent natural English at normal speed, richer vocabulary, occasional idioms and phrasal verbs. "
        "Push for detail, reasons and examples. Scaffold only when clearly needed."
    ),
    "C1": (
        "LEVEL C1 (advanced): sophisticated, precise English; nuanced questions, hypotheticals and abstract follow-ups. "
        "Expect precision and structure. Do not scaffold; challenge weak arguments politely."
    ),
}

COACHING_BLOCKS: dict[CoachingMode, str] = {
    "immersive": (
        "COACHING MODE — IMMERSIVE: never break character and never correct the learner out loud. "
        "Whenever you notice a grammar, vocabulary or pronunciation error, call log_correction silently (no spoken mention). "
        "If the learner uses Hindi/Hinglish, respond naturally in English without commenting."
    ),
    "gentle": (
        "COACHING MODE — GENTLE: stay in character. When the learner makes an error, do NOT explain it; instead naturally "
        "reformulate it correctly in your reply (an implicit recast), e.g. learner: 'I am working here since 3 years' → you: "
        "'Oh, you've been working there for three years? Nice.' Also call log_correction so it reaches the report. "
        "If the learner slips into Hindi/Hinglish, gently offer the English version once ('I think you mean X — try that in English?') and call log_code_switch."
    ),
    "active": (
        "COACHING MODE — ACTIVE COACH: stay in character, but at natural pauses give a ONE-LINE correction, then resume the role-play. "
        "Pattern: '(Quick tip: say X instead of Y.) Anyway, …'. Max one tip per turn; never stack tips. Call log_correction for every error you mention. "
        "If the learner uses Hindi/Hinglish, say the English phrase and ask them to repeat it, and call log_code_switch. Praise genuinely good phrases with log_good_phrase."
    ),
    "strict": (
        "COACHING MODE — STRICT / EXAM: formal register, no help, no hints (if asked for help, say help is not available in exam mode). "
        "Do not correct or comment during the session; call log_correction silently. Keep strict timing. "
        "At the end, when asked for a summary, give a brief band/score estimate. Never use Hindi."
    ),
    "drill": (
        "COACHING MODE — DRILL: run short rapid prompts. After EVERY learner attempt call score_drill_attempt with a 1–10 score and one line of feedback, "
        "then say the score and the single most important fix in one sentence, then immediately give the next prompt. Keep energy high and turns very short."
    ),
}

TOOLS_BLOCK = (
    "TOOLS: give_hint (only when the learner explicitly asks for help, or when told the learner is stuck), "
    "log_correction(original, corrected, category, explanation) for every error you notice, log_good_phrase for impressive language, "
    "log_code_switch when the learner uses Hindi words, lookup_word if the learner asks what a word means, change_tts_speed if asked to slow down or speed up, "
    "next_interview_question in interviews to move to the next question, score_drill_attempt in drills, switch_persona in multi-character scenarios, "
    "and end_session_with_summary when the learner says they want to end or when you are told time is up. Tool calls must not be mentioned aloud."
)

VOICE_RULES = (
    "You are speaking over voice: no markdown, no bullet points, no emojis, no stage directions. Keep turns under 45 words unless explaining something the learner asked for. "
    "Ask exactly one question at a time. Be warm, specific and encouraging; never shame the learner. Speak only English."
)


def fill_template(
    template: str,
    scenario: Scenario,
    learner_name: str,
    difficulty: Difficulty,
    duration_min: int | None,
) -> str:
    repl = {
        "{{persona.name}}": scenario.agentPersona.name,
        "{{persona.role}}": scenario.agentPersona.role,
        "{{persona.personality}}": scenario.agentPersona.personality,
        "{{learner.name}}": learner_name,
        "{{difficulty}}": difficulty,
        "{{duration}}": f"{duration_min} minutes" if duration_min else "an open-ended session",
    }
    out = template
    for k, v in repl.items():
        out = out.replace(k, v)
    return out


def profile_block(profile: dict[str, Any] | None) -> str:
    if not profile:
        return "LEARNER PROFILE: first session — no history yet. Observe carefully."
    parts = [f"LEARNER PROFILE: estimated level {profile.get('cefr', 'B1')}."]
    errs = profile.get("recurringErrors") or {}
    if isinstance(errs, dict) and errs:
        top = sorted(errs.items(), key=lambda kv: -int(kv[1]))[:3]
        parts.append(
            "Recurring error categories: "
            + ", ".join(f"{k} ({v})" for k, v in top)
            + " — subtly model the correct forms."
        )
    fillers = profile.get("fillerTrend") or []
    if isinstance(fillers, list) and fillers:
        last = fillers[-1]
        if isinstance(last, dict) and last.get("per100", 0) > 4:
            parts.append(
                f"Uses about {last['per100']:.0f} filler words per 100 words — leave pauses, don't rush them."
            )
    weak = profile.get("weakPhonemes") or []
    if isinstance(weak, list) and weak:
        parts.append("Weak sounds: " + ", ".join(str(w) for w in weak[:3]) + ".")
    pri = profile.get("priorities") or []
    if isinstance(pri, list) and pri:
        titles = [p.get("title") if isinstance(p, dict) else str(p) for p in pri[:2]]
        parts.append("Current priorities: " + "; ".join(t for t in titles if t) + ".")
    return " ".join(parts)


def characters_block(scenario: Scenario) -> str:
    if not scenario.characters:
        return ""
    lines = [
        "CHARACTERS: you alone play ALL of these people. Announce who is speaking by name when the speaker changes ('Rahul here — …'). Call switch_persona(name) before speaking as a different character so their voice is used."
    ]
    for c in scenario.characters:
        lines.append(f"- {c.name}, {c.role}: {c.personality}")
    return "\n".join(lines)


def build_instructions(
    *,
    scenario: Scenario,
    learner_name: str,
    difficulty: Difficulty,
    coaching_mode: CoachingMode,
    duration_min: int | None,
    profile: dict[str, Any] | None,
) -> str:
    scene = fill_template(
        scenario.systemPromptTemplate, scenario, learner_name, difficulty, duration_min
    )
    persona = scenario.agentPersona
    criteria = "; ".join(scenario.successCriteria)
    mistakes = "; ".join(scenario.commonMistakesToWatch)
    sections = [
        f"You are {persona.name}, {persona.role}. Personality: {persona.personality}. Accent/voice: {persona.accent}.",
        f"SCENARIO: {scenario.title}. {scenario.description}",
        scene,
        f"LEARNER GOAL: {scenario.learnerGoal} SUCCESS CRITERIA to steer towards: {criteria}.",
        f"WATCH FOR these typical mistakes: {mistakes}.",
        f"Useful phrases you may model naturally: {'; '.join(scenario.usefulPhrases[:4])}.",
        characters_block(scenario),
        DIFFICULTY_BLOCKS[difficulty],
        COACHING_BLOCKS[coaching_mode],
        profile_block(profile),
        f"TIME: {duration_min} minutes."
        if duration_min
        else "TIME: open-ended; wrap up gracefully when the learner wants to stop.",
        TOOLS_BLOCK,
        VOICE_RULES,
    ]
    return "\n\n".join(s for s in sections if s)
