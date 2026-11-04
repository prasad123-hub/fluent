# CLAUDE CODE PROMPT — "Fluent": LiveKit Voice AI English Communication Coach

> Paste this entire file into Claude Code (or save it as `SPEC.md` in an empty repo and say: _"Read SPEC.md and build it end-to-end. Run autonomously; follow the Autonomous Execution Rules exactly."_)

---

## 0. YOUR ROLE AND HOW TO WORK

You are a senior full-stack + voice-AI engineer and a product designer with Vercel-level taste. You are building a **production-ready, single-user** app called **Fluent** from scratch in this repository, working **autonomously overnight with no human in the loop**. This is NOT a demo, prototype, or testing UI — every screen must look and feel like a shipped Vercel product (Section 13 is mandatory, not optional).

**Autonomous Execution Rules (non-negotiable):**

1. **Never stop to ask questions.** If something is ambiguous, pick the most sensible option, record it in `docs/DECISIONS.md` (one line: decision + reason), and continue.
2. **Verify APIs before using them.** For anything LiveKit, use the LiveKit Agent Skills and Docs MCP server (Section 0.1) — never answer from memory. For Deepgram, OpenAI, Cartesia/ElevenLabs, Prisma, Next.js, Auth.js, Tailwind v4, Geist, or shadcn/ui, fetch the **current official docs** (WebFetch/WebSearch or Context7 if available). Do NOT write API calls from memory. Pin exact dependency versions you confirmed exist.
3. **Work in phases** (Section 12). After each phase: run lint + type-check + tests, fix failures, `git commit` with a descriptive message, and append a status entry to `docs/PROGRESS.md`.
4. **Tests must not need real API keys.** Mock all external providers in tests. Real keys only come from `.env` at runtime.
5. **Never leave the repo in a broken state.** If a phase can't be completed, stub it cleanly, mark it `TODO(phase-N)` in code, and log it in `docs/PROGRESS.md` under "Incomplete".
6. **Do not invent LiveKit features.** If the docs don't support something, implement it another way and log it.
7. At the very end, write `docs/FINAL_REPORT.md`: what was built, how to run it, what's incomplete, known bugs, and the first 5 things I should do when I wake up.
8. Prefer boring, well-documented libraries over clever ones. Prefer fewer dependencies.
9. Keep secrets out of git. `.env.example` must list every variable with a comment.
10. **Context-window recovery.** This run is long and your context will be compacted, possibly several times. The repo is your memory, not the conversation. Your very first action is to make sure the project root contains `SPEC.md` (this document) and a short `CLAUDE.md` that says: _"Full spec in SPEC.md. Before starting any phase, and immediately after any context compaction, re-read SPEC.md, docs/PROGRESS.md and docs/DECISIONS.md, then continue from the next unfinished phase. Never redo a completed phase."_ Keep `docs/PROGRESS.md` current after every phase (phase number, status, what's done, what's next, any blockers) and commit after every phase, so that a fresh context can resume from disk alone. Whenever you notice your context was compacted (the conversation starts with a summary), re-read those three files before touching code.

### 0.1 STEP ZERO — Install and use the official LiveKit Agent Skills (do this before anything else)

LiveKit publishes official Agent Skills (repo: `livekit/agent-skills`) that teach you how to build, debug, test, simulate, and deploy LiveKit voice agents, plus a **Docs MCP server** for looking up current LiveKit APIs. You MUST have them loaded before writing any LiveKit code.

**Install procedure (pick exactly ONE method — installing twice loads duplicate copies that compete with each other):**

1. First check whether the skills are already available (the user may have installed the Claude Code plugin before starting you). Look for skills named `livekit:reading-livekit-docs`, `livekit:building-livekit-agents`, etc. in your available skills list, and check whether a LiveKit Docs MCP server is connected. If present → skip installation and go to the usage rules below.
2. If NOT present, install from the shell (the plugin `/plugin` slash commands are user-only and you cannot run them):
   - Preferred: `npx skills add livekit/agent-skills` (installs into this project's skills directory, e.g. `.claude/skills/`).
   - Alternative: install the LiveKit CLI (`lk`, v2.19.0 or later) and run `lk skills install` in the project directory — this also sets up the Docs MCP server.
   - Last resort: clone `https://github.com/livekit/agent-skills` and copy the directories under `skills/` into `.claude/skills/`.
     After installing, confirm the skills are visible to you; if a restart is required for them to load, note that in `docs/PROGRESS.md` and continue using `lk docs` / `https://docs.livekit.io/llms.txt` + WebFetch as the docs source in the meantime.
3. If you installed the older `livekit-agents` or `livekit-simulations` skills at any point, delete them — only the current skill set should exist.
4. Also make sure the LiveKit Docs MCP server or `lk docs` is usable for lookups. If neither works, fall back to fetching pages from `https://docs.livekit.io/` (start from `llms.txt`) and log the limitation.

**Usage rules — which skill to use when (the skills hand off to each other by name; load only what the task needs):**

| Skill                         | When you must use it                                                                                                                                                                                                                   |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reading-livekit-docs`        | FIRST, before any LiveKit API usage. Every LiveKit fact (AgentSession, plugins, dispatch, room metadata, tokens, Egress, components-react) comes from here, never from memory.                                                         |
| `building-livekit-agents`     | Phase 5 & 7 — agent architecture, latency budget, keeping LLM context small, agent handoffs/tasks (e.g. panel-interview persona switching), designing for voice.                                                                       |
| `debugging-livekit-agents`    | After every meaningful agent change — run a multi-turn conversation against the locally running agent with `lk agent debugger`. This is your default way to verify the agent actually works, since no human will talk to it overnight. |
| `testing-livekit-agents`      | Phase 8 — write turn-level pytest tests for agent behaviour (coaching modes, Hinglish redirect, silence handling, tool calls).                                                                                                         |
| `writing-livekit-scenarios`   | Phase 8/10 — turn the Section 3 scenarios + coaching modes into simulation scenarios; wire the agent to seed and grade state from them.                                                                                                |
| `running-livekit-simulations` | Phase 8/12 — run simulations locally and in CI; triage failures and fix them. Add a CI job for this.                                                                                                                                   |
| `operating-livekit-agents`    | Phase 12 — write `docs/DEPLOYMENT.md` for deploying the agent worker to LiveKit Cloud: prewarming, timeouts, graceful shutdown, rollback, SDK upgrades.                                                                                |

If you installed as a Claude Code plugin, skills are namespaced (`/livekit:building-livekit-agents`, not `/building-livekit-agents`). Record which install method you used and the skill versions/commit in `docs/RESEARCH_NOTES.md`.

---

## 1. PRODUCT VISION

**Fluent** is a personal web app where **I** (a single user — there are no other users, no rooms to share, no invites, no multiplayer) practice **spoken English and communication skills** by talking in real time with an AI voice agent built on **LiveKit**. The agent role-plays realistic scenarios (daily life, office, interviews, etc.), keeps the conversation going, coaches me, and after every session produces a **deep analysis of my spoken English** that is shown on my **dashboard** tracking progress over time.

**Primary user:** an Indian English speaker (Hindi/Marathi L1) who wants to become a confident, fluent, professional English communicator. The app must handle **code-switching into Hindi/Hinglish** gracefully (detect it, gently redirect to English, and count it as a metric).

**The core loop is deliberately simple:**

1. I open the app → I see my dashboard with one prominent **"Practice"** button.
2. I click **Practice** → I pick a scenario (or hit "Quick start" which picks the recommended one for me) → the **Practice page** opens and I'm talking to the agent within seconds.
3. I click **End** → within ~60s I see a full **Session Report**, and my dashboard updates (scores, trends, mistakes, vocabulary, next recommended drills).

**Explicitly OUT of scope (do not build):** multi-user rooms, join-by-code, invite links, lobbies, public session browsing, leaderboards, friends, per-participant reports, team/org features. Any such thing in this spec from earlier drafts is removed — if you see a leftover reference, ignore it and log it.

---

## 2. TECH STACK (use this unless docs prove something is broken; then substitute and log it)

| Layer              | Choice                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Real-time audio    | **LiveKit** (LiveKit Cloud by default; `docker-compose` option for self-hosted server)                                                                                                                                                                                                                                                                                                                     |
| Voice agent        | **LiveKit Agents framework (Python, latest stable 1.x)** with `AgentSession`, plugins: STT, LLM, TTS, VAD, turn detection                                                                                                                                                                                                                                                                                  |
| STT                | **Deepgram** (nova, with word-level timestamps + confidence + filler words enabled). Fallback: OpenAI Whisper/`gpt-4o-transcribe`.                                                                                                                                                                                                                                                                         |
| LLM (conversation) | **OpenAI** (`gpt-4o`/`gpt-4.1` class; check docs) via LiveKit plugin. Make provider swappable (Anthropic Claude as alternative via env var).                                                                                                                                                                                                                                                               |
| LLM (analysis)     | Same provider; structured JSON output with strict schema (Pydantic).                                                                                                                                                                                                                                                                                                                                       |
| TTS                | **Cartesia** (default, low latency) with **ElevenLabs** and **OpenAI TTS** as env-switchable alternatives.                                                                                                                                                                                                                                                                                                 |
| VAD / turn-taking  | Silero VAD + LiveKit turn detector model; support barge-in (interruptions).                                                                                                                                                                                                                                                                                                                                |
| Frontend           | **Next.js 15 (App Router) + TypeScript + Tailwind v4 + shadcn/ui** restyled to the **Vercel / Geist design system** (Section 13), `geist` font package, `@livekit/components-react` for audio/room primitives (UI fully custom-styled), Recharts (styled to match Vercel's chart look), `cmdk`, `sonner`, `framer-motion` (subtle only)                                                                    |
| Backend API        | Next.js Route Handlers (token minting, sessions CRUD, dashboard queries). Separate **Python FastAPI** service only if needed for analysis jobs (prefer running analysis inside the agent worker on session end).                                                                                                                                                                                           |
| DB                 | **PostgreSQL** via **Prisma** (frontend) — Python side reads/writes the same DB via SQLAlchemy or a small internal HTTP API (pick one, log it). Local dev: Postgres in docker-compose. Production: Neon/Vercel Postgres (document both).                                                                                                                                                                   |
| Auth               | **Single-user auth**: a simple, secure login gate — one owner account whose credentials come from env (`OWNER_EMAIL`, `OWNER_PASSWORD_HASH`) using Auth.js (NextAuth) Credentials provider with secure httpOnly session cookies, rate-limited login, and middleware protecting every page/API. No sign-up page. Keep a single `userId` in the DB so the schema stays clean, but never build multi-user UI. |
| Storage            | Session audio recordings via **LiveKit Egress** → S3-compatible bucket (MinIO in docker-compose). Optional; must degrade gracefully if not configured.                                                                                                                                                                                                                                                     |
| Jobs/queue         | Keep it simple: analysis runs at session end in the agent worker. If needed, use a Postgres-backed job table. No Redis unless required.                                                                                                                                                                                                                                                                    |
| Monorepo           | `pnpm` workspaces + `apps/web`, `apps/agent` (Python, `uv`), `packages/shared` (JSON schemas for scenario definitions + analysis result types, generated to both TS and Pydantic)                                                                                                                                                                                                                          |
| Testing            | Vitest + Playwright (web), pytest (agent). CI workflow in `.github/workflows/ci.yml`.                                                                                                                                                                                                                                                                                                                      |
| Tooling            | ESLint, Prettier, Ruff, mypy (lenient), Makefile / `pnpm` scripts, `docker-compose.yml`                                                                                                                                                                                                                                                                                                                    |

---

## 3. SCENARIO & THEME LIBRARY (seed ALL of these into the DB as data, not hardcoded in prompts)

Each **Theme** contains multiple **Scenarios**. Each Scenario has: `id, title, theme, description, difficulty (A2/B1/B2/C1), agentPersona (name, role, personality, accent hint), agentOpeningLine, learnerGoal, successCriteria[], keyVocabulary[], usefulPhrases[], commonMistakesToWatch[], suggestedDurationMin, mode (roleplay | discussion | interview | drill | free-talk), systemPromptTemplate`.

**Themes and minimum scenarios to seed:**

1. **Daily Life** — introducing yourself; small talk with a neighbour; at a restaurant (ordering, complaining politely); grocery/shopping & bargaining; asking for directions; at the doctor; at the bank; booking a cab/hotel; phone call to customer support; making weekend plans with a friend; talking about hobbies/movies/cricket; describing your hometown.
2. **Office & Workplace** — daily stand-up update; asking a manager for leave; giving a status update to a client; disagreeing politely in a meeting; giving and receiving feedback; explaining a delay; asking for a raise/promotion; onboarding a new teammate; writing-to-speaking: summarising an email aloud; coffee-break small talk; escalating an issue; running a meeting as chair.
3. **Interviews** — HR screening ("tell me about yourself"); behavioural (STAR) questions; technical interview explanation (explain a project / a concept simply); "why should we hire you" / salary negotiation; mock panel interview (agent plays 2 interviewers); case/consulting-style question; exit interview; campus placement interview.
4. **Presentations & Public Speaking** — 2-minute elevator pitch; present a slide deck (agent asks follow-ups); product demo; toast/thank-you speech; explain a complex idea to a 10-year-old.
5. **Debate & Group Discussion** — GD simulation (agent plays the moderator AND 2 other participants with distinct voices/personas, so I practice jumping in and holding the floor); structured debate (agent as opponent); devil's advocate practice; "Just A Minute" (JAM) impromptu speaking.
6. **Negotiation & Persuasion** — rent negotiation; vendor pricing; convincing a friend to change plans; handling an angry customer; sales cold call.
7. **Travel & Abroad** — airport immigration; hotel check-in problem; lost luggage; asking a local for recommendations; university admission/visa interview.
8. **Exams** — IELTS Speaking Part 1/2/3 simulation with band estimate; TOEFL independent speaking; OET/PTE-style describe-image.
9. **Social & Networking** — meeting someone at a conference; LinkedIn-style introduction; following up after an event; polite refusal; apologising.
10. **Storytelling & Narration** — tell a story from your childhood; describe a picture (agent describes an image concept; or user uploads image → vision LLM); narrate your day in past tense; retell a news article.
11. **Pronunciation & Accent Lab (drills)** — minimal pairs (ship/sheep, v/w, th sounds — common for Indian speakers); word stress; sentence intonation; linking & reductions; shadowing (agent speaks a sentence, user repeats, agent scores similarity); tongue twisters; reading a passage aloud.
12. **Fluency Drills** — filler-word elimination (agent beeps/notes every "um/like/basically"); speak 60 seconds without stopping; paraphrase challenge (say the same thing 3 ways); vocabulary upgrade (agent gives a basic sentence, user says it with better words); question chain (user must ask 10 good questions).
13. **Free Talk** — open conversation with a chosen persona (friendly coach, strict professor, witty colleague, patient tutor).

Also implement a **Custom Scenario builder**: user types a situation in plain English ("I'm meeting my CEO for the first time at an offsite") → LLM generates a full Scenario object matching the schema → saved to the user's library.

---

## 4. PRACTICE FLOW (single user — one button)

**Session model:** `id, userId, scenarioId, difficulty, coachingMode, agentVoice, status (starting | live | ended | analyzing | complete | failed), livekitRoomName, startedAt, endedAt, durationSec, recordingUrl?`. Rooms are private and internal — the user never sees a room name or code.

**The Practice flow (must be fast and frictionless):**

1. **Dashboard → "Practice" button** (primary CTA, top of the page, also in the command menu `⌘K → Practice`).
2. **Practice launcher** (`/practice`): a clean Vercel-style two-column page.
   - Left: **Scenario picker** — search, theme tabs/filter chips, difficulty filter, "Recommended for you" row (driven by learner profile), "Recent" row, favourites, and a **Quick start** card that uses my default scenario/mode from Settings.
   - Right: **Session config** card — Difficulty (A2–C1 segmented control), **Coaching Mode**, agent voice & speed, session length (5/10/15/20 min or open), toggles for captions/key-phrases sidebar. All defaults remembered from last time so a repeat session is one click.
   - Big primary button: **Start practice**.
3. **Pre-flight (inline, 3 seconds, skippable after first time)**: mic permission, input level meter, device selector, headphones tip, quick STT sanity check ("say: I'm ready").
4. Backend creates a LiveKit room, mints my token, dispatches the agent with room metadata `{sessionId, scenarioId, coachingMode, difficulty, voice, durationMin}`. The Practice page (`/practice/[sessionId]`) opens; the agent greets me with `agentOpeningLine` within ~2s of connection.
5. **End** → status `analyzing` → report page shows a tasteful skeleton/progress state → auto-switches to the full **Session Report** when ready.

There is no join, lobby, invite, or participant list anywhere in the product.

**Coaching Modes (critical feature, selectable per session):**

- **Immersive** — agent never breaks character; corrections only in post-session report.
- **Gentle** — agent stays in character but naturally reformulates mistakes ("Oh, you _have been working_ there for 3 years? Nice.") — i.e., implicit recasts.
- **Active Coach** — agent pauses at natural points to give a 1-line correction, then resumes.
- **Strict / Exam** — timed, formal, no help, band score at the end.
- **Drill** — short rapid prompts with instant scoring.

**Practice page UI (the most important screen — must feel like a polished product, Vercel-dark, focused, no clutter):**

- Centre stage: animated **agent orb/visualizer** (audio-reactive, Geist-style monochrome with a single accent) that shows listening / thinking / speaking states; my own input level ring below it.
- **Live captions** of both sides (scrolling transcript) with option to hide (to practice listening).
- Timer, scenario goal card, key phrases sidebar (collapsible, can be hidden for difficulty).
- "**Help me**" button → agent gives a hint of what to say. "**Repeat that**" button. "**Slow down**" button (agent switches TTS speed). "**Pause**", "**End session**".
- Push-to-talk toggle vs open mic; noise-suppression toggle (Krisp via LiveKit if available).
- Live mini-metrics (optional toggle): filler word counter, speaking time share %, current WPM.
- Reconnection handling, mic permission errors, graceful messages.

---

## 5. VOICE AGENT DESIGN (apps/agent)

- One worker entrypoint using LiveKit Agents `AgentSession` with STT → LLM → TTS pipeline, VAD + turn detection, interruptions enabled.
- **Dynamic Agent class per scenario**: build instructions from `scenario.systemPromptTemplate` + persona + difficulty + coaching mode + learner profile (their weak areas from past sessions, injected as context: "This learner often drops articles and uses 'basically' a lot — subtly model correct usage").
- **Difficulty controls**: vocabulary ceiling, sentence length, speaking speed (TTS rate), how much the agent scaffolds, how quickly it moves to harder questions.
- **Agent tools (function calling)**: `give_hint()`, `log_correction(original, corrected, category, explanation)` (called silently whenever it notices an error — this feeds the error log even in Immersive mode), `log_good_phrase(phrase)`, `set_timer`, `end_session_with_summary()`, `change_tts_speed(rate)`, `next_interview_question()`, `score_drill_attempt(score, feedback)`, `lookup_word(word)` (dictionary definition/pronunciation), `switch_persona()` for panel interviews.
- **Hinglish handling**: detect Hindi words/sentences in transcript (simple lexicon + LLM check). In Gentle/Active modes, the agent responds: "I think you mean _X_ — try saying that in English?" and logs a `code_switch` event. Never shame the user.
- **Silence / stuck handling**: if user is silent > 6s, agent offers a prompt; if silent > 20s, offers a hint or simplifies the question.
- **Latency budget**: target < 1.2s from user end-of-speech to agent first audio. Log timings per turn (`stt_ms, llm_ttft_ms, tts_ttfb_ms`) to the DB for an internal latency panel.
- **Capture everything**: every user utterance with word-level timestamps, confidence, detected fillers, pause durations between words, start/end time; agent utterances; tool calls; events (interruptions, hints, code-switches). Persist incrementally (not only at end) so a crash doesn't lose the session.
- **GD / panel scenarios**: the single agent plays multiple characters (distinct names, personalities, and TTS voices) using agent handoffs/tasks per `building-livekit-agents` guidance, so "group" practice works with one user.
- **On session end** (user ends, timer ends, or inactivity timeout): finalise transcript → run analysis pipeline (Section 6) → update session status → notify frontend (poll or SSE).
- Agent must be robust: retry provider errors, fall back to alternative TTS/STT on failure, never crash the room.

---

## 6. ANALYSIS ENGINE (the heart of the product)

Produce an `AnalysisReport` per session, stored as JSONB + normalised metric rows for charting. Use a **hybrid**: deterministic metrics computed in Python from timestamps/text + LLM-judged metrics with a strict JSON schema and rubric (temperature 0, include evidence quotes from the transcript for every claim).

### 6.1 Deterministic metrics (compute in code, unit-tested)

- **Speaking time** (sec) and **talk-share %** vs the agent.
- **Words per minute** (overall, and per-minute series for a chart) with target band 120–160 WPM.
- **Pause analysis**: count and total duration of pauses > 0.5s / > 1.5s / > 3s inside turns; **mean response latency** (agent finishes → user starts).
- **Filler words** per 100 words: um, uh, like, you know, basically, actually, so, I mean, kind of, right — plus Indian-English-specific: "only", "itself", "no?", "na", "means", "the thing is". Frequency list with timestamps.
- **Repetitions / false starts / self-corrections** (n-gram repetition within short windows).
- **Vocabulary**: unique words, type-token ratio (MATTR), average word length, % words in top-1k/2k/5k frequency lists, estimated **CEFR vocab level**, rare/advanced words used, overused words.
- **Sentence stats**: avg sentence length, % questions asked, % complex sentences (subordinate clauses).
- **Pronunciation signal** from STT: low-confidence words list (likely mispronounced), word-level confidence distribution. Mark phonemes/words common for Indian L1 (v/w, th, r, ʒ, word stress) if detected.
- **Code-switch count** and list.
- **Turn-taking**: number of turns, avg turn length, interruptions made/received, times user needed a hint.

### 6.2 LLM-judged metrics (0–100 each + CEFR band + evidence)

- **Grammar accuracy** — list of errors: `{quote, correction, category (tense | article | preposition | subject-verb | word order | plural | modal | conditional | other), explanation, severity}`.
- **Vocabulary range & precision** — including "upgrade suggestions" (basic → better word).
- **Fluency & coherence** — logical flow, linking words, staying on topic.
- **Pronunciation & clarity** (judged from STT confidence + context) — flagged words.
- **Task achievement** — did the user meet the scenario's `successCriteria`? (per-criterion ✓/✗ with evidence).
- **Communication skills** (the "soft" layer): clarity of structure (e.g., STAR for interviews), conciseness, active listening (did they respond to what was asked?), politeness & register appropriateness for the context (too casual in an interview? too stiff with a friend?), assertiveness, question-asking, empathy, persuasiveness (for negotiation), confidence markers vs hedging ("I think maybe…").
- **Interview-specific**: answer structure, relevance, red flags, "hireability" estimate with reasons.
- **IELTS mode**: band estimate for Fluency/Coherence, Lexical Resource, Grammatical Range & Accuracy, Pronunciation.

### 6.3 Composite outputs

- **Overall score (0–100)** with weighted formula documented in `docs/SCORING.md`; **estimated CEFR level** (A2–C1); **confidence index**.
- **Top 3 strengths**, **top 3 priorities to fix**, each with concrete examples from this session.
- **"Say it better" rewrites**: 5–10 of the user's actual sentences rewritten at native-professional level, with a one-line why.
- **Personalised drills for next time**: 3 recommended scenarios/drills mapped to weaknesses.
- **Vocabulary bank entries**: new/advanced words the agent used + words the user should learn (with definition, example, IPA).
- **Session summary paragraph** (plain English, encouraging, specific).
- Compare with user's last 5 sessions: deltas per metric.

### 6.4 Learner profile (persistent, updated after every session)

`userProfile`: current CEFR, rolling averages per metric, recurring error categories (with counts), filler words trend, vocab level trend, streak, total minutes spoken, weak phonemes, goals. This profile is injected into the agent's context for future sessions.

---

## 7. DASHBOARD (apps/web, /dashboard)

Build a polished, data-rich dashboard that looks like the Vercel dashboard (Section 13). Layout: Vercel-style top navbar (logo, breadcrumb, right-side avatar/theme toggle) + horizontal tab bar under it (Overview · Progress · Sessions · Mistakes · Vocabulary · Pronunciation · Goals · Settings) with the animated sliding underline, exactly like Vercel's project pages. Pages:

1. **Overview** — hero row: big **Practice** CTA + "Quick start: {recommended scenario}"; stat cards (overall score with delta, CEFR badge, streak, total minutes, sessions this week); radar chart of the 8 core skills (grammar, vocabulary, fluency, pronunciation, coherence, task achievement, communication, confidence); trend line (last 30 sessions); "This week's focus" card; recent sessions list; recommended drills.
2. **Progress** — per-metric line charts over time with selectable range (7d/30d/90d/all); WPM and filler-words-per-100 trends; vocab level trend; per-theme performance (I'm stronger in Daily Life than Interviews); best/worst sessions.
3. **Sessions** — Vercel-style data table of all sessions (date, scenario, mode, duration, score, CEFR, status) with filters, sorting, pagination; each opens **Session Report**.
4. **Session Report** — score cards; full transcript with inline error highlights (hover → correction popover); audio playback synced to transcript (if recording exists); timeline chart of WPM & pauses; filler word heatmap; grammar error table grouped by category; "Say it better" list; task criteria checklist; strengths/priorities; recommended next drills; **Practice again** button; **export PDF** / download transcript.
5. **Mistakes** — aggregated error log across all sessions, grouped by category with counts, trend (are articles improving?), "Practice this" button that launches a targeted drill session.
6. **Vocabulary** — word bank with status (new / learning / mastered), **spaced-repetition flashcards** (voice mode: agent says word, I use it in a sentence, agent scores), search, export.
7. **Pronunciation** — weak sounds list, mispronounced-words list with play-reference-audio (TTS) + record-and-compare, minimal-pair drill launcher.
8. **Goals** — set weekly minutes/sessions targets, target CEFR by date; progress bars; optional email reminders (Resend).
9. **Settings** — profile (name, L1), default scenario/mode/difficulty, agent voice & speed, mic/device defaults, captions default, API usage & cost this month, data export (JSON), clear all data, theme (dark default / light / system).

Also a **Landing page** (`/`, public, Vercel.com-style — see Section 13) and a **Scenario Library** (`/scenarios`: browse themes, difficulty, search, favourites, custom scenarios, scenario detail drawer with "Practice this" button).

---

## 8. DATA MODEL (Prisma; mirror in Pydantic)

`User` (single owner row), `UserProfile`, `Theme`, `Scenario`, `Session`, `Utterance` (sessionId, speaker human|agent, agentCharacter?, text, startMs, endMs, words JSONB [{w, start, end, conf}], isFiller flags), `SessionEvent` (type: hint | correction | code_switch | interruption | tool_call | latency, payload JSONB, atMs), `AnalysisReport` (sessionId, overall, cefr, metrics JSONB, errors JSONB, rewrites JSONB, summary, createdAt), `MetricPoint` (sessionId, metricKey, value, at) for fast charts, `GrammarError` (normalised rows for aggregation), `VocabEntry` (word, status, nextReviewAt, easeFactor), `Goal`, `CustomScenario`, `Favourite`, `UsageLog` (provider, tokens/chars, estimated cost, sessionId). Add indexes for dashboard queries. Provide `prisma/seed.ts` with ALL scenarios from Section 3 (write rich, realistic content — this is the product; don't stub it with 2 scenarios).

---

## 9. API SURFACE (Next.js route handlers, all auth-protected)

- `POST /api/sessions` create (creates room, dispatches agent, returns `{sessionId, livekitUrl, token}`); `GET /api/sessions/:id` (status polling / SSE); `POST /api/sessions/:id/end`; `GET /api/sessions?filter`.
- `GET /api/reports/:sessionId`; `GET /api/dashboard/overview`, `/progress`, `/mistakes`, `/vocab`, `/pronunciation`.
- `POST /api/scenarios/custom` (LLM-generated); `GET /api/scenarios`; `POST /api/scenarios/:id/favourite`.
- `POST /api/vocab/review`; `GET/PUT /api/settings`; `GET /api/usage`.
- Prefer **Server Components + Server Actions** for dashboard reads/writes where it keeps things simpler; route handlers for anything the agent or client polls.
- Internal (agent → web) `POST /internal/*` with shared secret, OR agent writes DB directly — pick one, log it.
- Webhook endpoint for LiveKit events (room_finished → trigger finalisation as a safety net).

---

## 10. NON-FUNCTIONAL REQUIREMENTS

- **Latency**: instrument and show p50/p95 per-turn latency in an `/admin/health` page.
- **Cost control**: log token/char usage per provider per session; env var caps (max session minutes, daily minutes); usage shown in Settings.
- **Reliability**: incremental persistence; webhook safety net; idempotent analysis job; retries with backoff; sessions stuck in `analyzing` > 5 min get retried then marked `failed` with a visible "Retry analysis" button.
- **Privacy**: recordings optional and user-controlled; clear-all-data works; transcripts not sent anywhere except configured LLM.
- **Production readiness**: proper 404/500/error boundaries, loading/skeleton states on every data view, empty states with CTAs (no blank pages), optimistic UI where sensible, no console errors/warnings, no `any`, strict TS, Lighthouse ≥ 90 on landing & dashboard (performance/accessibility/best practices/SEO), metadata + OG image, security headers, env validation at boot (zod) with clear failure messages, graceful degradation when optional services (Egress/MinIO/Resend) are not configured.
- **Accessibility**: keyboard navigable, visible focus rings (Vercel-style), captions, proper contrast in dark mode.
- **Mobile-responsive** everywhere, especially the Practice page (phone usage is common).
- **Observability**: structured logs (pino / structlog), request IDs, agent logs tagged with sessionId.
- **Docs**: `README.md` (one-command local setup with docker-compose: Postgres + MinIO + optional LiveKit server), `docs/ARCHITECTURE.md` (diagram in Mermaid), `docs/SCORING.md`, `docs/SCENARIO_AUTHORING.md`, `docs/DEPLOYMENT.md` (LiveKit Cloud + Vercel for web + Fly.io/Railway/Docker for agent worker).

---

## 11. ACCEPTANCE CRITERIA (Definition of Done)

- [ ] `docker compose up` + `pnpm dev` + `uv run agent dev` brings up a working local app with seeded scenarios.
- [ ] I can log in, click **Practice**, pick "Job Interview – HR screening", start, talk with the agent by voice, be interrupted/interrupt, press Help, end the session, and within ~60s see a full Session Report. From dashboard to speaking takes ≤ 3 clicks.
- [ ] Dashboard Overview, Progress, Sessions, Mistakes, Vocabulary pages render real data from ≥ 3 sessions (write a dev script that generates realistic fake sessions/reports for demo: `pnpm seed:demo`).
- [ ] Every page matches the Vercel/Geist design system (Section 13): dark mode default, Geist fonts, Vercel tokens, nav + tab bar pattern, no default shadcn look, no placeholder/lorem content. Take screenshots of every page with Playwright and save them to `docs/screenshots/` for me to review.
- [ ] Landing page is a credible Vercel.com-style marketing page for the product.
- [ ] No multi-user, join, invite, or room-code UI exists anywhere.
- [ ] All 13 themes seeded with ≥ 5 scenarios each (≥ 65 total), each with full persona, goals, vocabulary, success criteria.
- [ ] Coaching modes demonstrably change agent behaviour (document with example transcripts in `docs/COACHING_MODES.md`).
- [ ] Deterministic metrics have unit tests with fixtures; LLM analysis has schema validation tests with mocked responses.
- [ ] LiveKit Agent Skills are installed (one method only) and recorded in `docs/RESEARCH_NOTES.md`; the agent was verified via `lk agent debugger`; turn-level agent tests and LiveKit simulations exist and pass.
- [ ] CI passes (lint, type-check, tests, simulations) on a clean checkout.
- [ ] `.env.example` complete; README accurate; FINAL_REPORT written.

---

## 12. EXECUTION PLAN (do in order; commit after each)

0. **Install LiveKit Agent Skills (Section 0.1).** Verify they load. Commit the skills directory (or note the plugin) and log the method in `docs/RESEARCH_NOTES.md`.
1. **Research (≤ 30 min of effort):** using `reading-livekit-docs` (Docs MCP / `lk docs`), look up LiveKit Agents (Python) `AgentSession`, plugins (Deepgram STT, OpenAI LLM, Cartesia TTS, Silero VAD, turn detector), agent dispatch & room metadata, token grants, Egress, and components-react. Then fetch docs for Deepgram word timestamps/filler option, Prisma, Auth.js Credentials provider + Next.js App Router, Tailwind v4, and the Geist design system (Section 13.1). Write `docs/RESEARCH_NOTES.md` with the exact API shapes you'll use.
2. **Scaffold + design system:** monorepo, docker-compose, Prisma schema + migrations, Pydantic mirrors, env handling, CI, lint/format. Then implement the **Vercel/Geist design system foundation** (Section 13): Tailwind tokens, Geist fonts, restyled shadcn components, app shell (navbar + tab bar), theme toggle, and a `/design` dev-only page showing every component. Commit.
3. **Scenario content:** write all themes/scenarios (Section 3) as structured seed data. Commit.
4. **Session backend:** single-user auth gate, sessions CRUD, LiveKit token minting, room creation, agent dispatch metadata, webhook. Commit.
5. **Agent MVP** (use `building-livekit-agents`): worker joins room, converses using scenario prompt, persists utterances with word timestamps, basic end-of-session. Verify with `debugging-livekit-agents` (`lk agent debugger`, multi-turn). Commit.
6. **Practice flow UI:** Practice launcher, pre-flight, Practice page (orb, captions, controls), analyzing state. Commit.
7. **Coaching modes + agent tools + Hinglish + silence handling + multi-character scenarios.** Verify each coaching mode with the debugger and save example transcripts to `docs/COACHING_MODES.md`. Commit.
8. **Analysis engine + agent tests:** deterministic metrics + pytest; LLM rubric + schema + tests with mocked responses; learner profile update; report persistence. Then use `testing-livekit-agents` for turn-level agent tests, and `writing-livekit-scenarios` + `running-livekit-simulations` to create and run simulations for at least 5 scenarios × 2 coaching modes; wire simulations into CI. Commit.
9. **Dashboard + landing:** all dashboard pages, charts, session report with transcript highlighting, scenario library, landing page, demo seed script. Playwright screenshots of every page into `docs/screenshots/`. Commit.
10. **Drills:** pronunciation lab, fluency drills, vocab flashcards (voice). Commit.
11. **Recording/Egress (optional), PDF export, goals, settings, usage/cost page.** Commit.
12. **Hardening + deployment docs:** error states, reconnection, mobile, latency instrumentation, cost caps, docs. Use `operating-livekit-agents` to write `docs/DEPLOYMENT.md` (LiveKit Cloud deploy of the agent worker, prewarming, timeouts, graceful shutdown, rollback) and add a `Dockerfile` for the agent. Write FINAL_REPORT. Final commit.

If time runs out, phases 1–9 are the must-haves; 10–12 are nice-to-haves. Prioritise a **working, polished core loop** over breadth.

---

## 13. DESIGN SYSTEM — VERCEL / GEIST, DARK MODE FIRST (mandatory)

The entire app must look and feel like a **Vercel product** (vercel.com marketing site + the Vercel dashboard), built on the **Geist design system**. The goal is that if someone screenshots any page, it could pass as a Vercel-made app. Do not ship the default shadcn/ui look.

### 13.1 Research first

- Before writing any UI, study the Geist design system reference at `https://vercel.com/geist` (colors, typography, spacing, components, icons) and the current look of `https://vercel.com` and the Vercel dashboard. Check whether an official Geist React component package exists on npm at this time (verify, don't assume); if it does and it's usable, use it; otherwise **rebuild the Geist look on top of shadcn/ui + Tailwind** by overriding tokens and component styles. Record what you found in `docs/DESIGN_SYSTEM.md`.
- Install the `geist` npm package for **Geist Sans** and **Geist Mono**. All UI text uses Geist Sans; code, numbers in tables, IDs, timestamps, and metric values use Geist Mono.

### 13.2 Tokens (implement as CSS variables in `globals.css`, consumed by Tailwind)

- **Dark mode is the default** (`<html class="dark">` on first load; respect user override; light mode must also be complete and correct).
- **Backgrounds (dark)**: page `#000000`; elevated surfaces `#0a0a0a`; cards/popovers `#0a0a0a`–`#111111`; hover `#1a1a1a`. **Light**: `#ffffff` / `#fafafa` / `#f5f5f5`.
- **Borders**: 1px hairlines using Vercel's gray scale (`#333`/`#2e2e2e` dark; `#eaeaea`/`#e5e5e5` light). Borders, not shadows, define structure. Shadows are subtle and only on floating elements.
- **Text**: primary `#ededed` (dark) / `#171717` (light); secondary `#a1a1a1` / `#666`; tertiary `#666` / `#888`.
- **Accent & semantic colors** from Geist: blue (`#0070f3`-family for primary actions/links), green (success), amber (warning), red (error), purple/pink for the occasional gradient. Use Geist's full 1–10 scales for gray, blue, red, amber, green, teal, purple, pink.
- **Radius**: 6px for buttons/inputs, 8px–12px for cards, full for pills/avatars. **Spacing**: 4px grid. **Type scale**: 12/13/14/16/20/24/32/48/64 with tight tracking on large headings (`tracking-tight`, `-0.02em`+).
- **Focus**: Vercel-style 2px offset blue focus ring. **Transitions**: 150–200ms ease; hover states subtle (border lightens, background one step up).

### 13.3 Components & patterns (restyle every shadcn primitive to match)

- **App shell**: top navbar (logo/wordmark "Fluent" + breadcrumb-style context like Vercel's `Team / Project`; right side: ⌘K search, theme toggle, avatar menu) and a **horizontal tab bar** beneath it with the animated sliding underline indicator (Vercel's project-nav pattern). No left sidebar on the dashboard.
- **Buttons**: Vercel variants — primary (white-on-black in dark mode / black-on-white in light), secondary (bordered), tertiary/ghost, destructive; sizes sm/md/lg; loading spinner state; icon buttons.
- **Cards** with hairline borders, optional header row with title + description + right-aligned action; **stat cards** with big mono numbers and small delta badges (▲ 4.2 in green / ▼ in red).
- **Data tables** (TanStack Table) in Vercel's style: dense, hairline rows, sticky header, sort indicators, row hover, pagination footer, column filters.
- **Inputs/selects/segmented controls/switches/sliders** in Geist style; **badges/pills** (status: live, analyzing, complete, failed) with dot indicators like Vercel deployment statuses.
- **Command menu** (`cmdk`, ⌘K): navigate pages, start practice with a scenario, search scenarios, toggle theme.
- **Toasts** (`sonner`, Vercel-styled), **dialogs/sheets/drawers**, **tooltips**, **popovers**, **skeletons** (shimmer), **empty states** (icon + title + description + primary CTA), **error states** with retry.
- **Charts** (Recharts) styled like Vercel Analytics: thin lines, subtle grid, monochrome by default with one accent, custom tooltip card, gradient area fill under line charts, no chart junk.
- **Icons**: Geist icons if available; otherwise `lucide-react` at 16px with 1.5px stroke, matching Vercel's icon weight.
- **Motion**: restrained. Tab underline slide, fade/slide on page load (`framer-motion`), orb animation on the Practice page, number count-ups on stat cards. No bouncy or playful animations.

### 13.4 Landing page (`/`, public) — Vercel.com style

- Full-black hero with a huge, tight-tracked headline (e.g. "Speak English like you mean it."), a gradient-text accent line, subtle grid/dots background, two CTAs (**Start practicing** primary, **See how it works** secondary), and a product screenshot/mock of the Practice page in a bordered, glowing frame.
- Sections: logo-style "scenario strip" (themes as monochrome pills marquee); **bento grid** of features (real-time voice coaching, deep analysis, 65+ scenarios, pronunciation lab, progress tracking, Hinglish-aware) with hairline-bordered cells and small illustrative visuals; "How it works" 3-step row; an example **Session Report** preview; metrics band (e.g. "8 skills tracked · <1.2s latency · 13 themes"); FAQ accordion; final CTA band; minimal footer.
- Must be fully responsive, fast (static where possible), with proper metadata and an OG image.

### 13.5 Practice page design

- Focus mode: navbar collapses to a minimal bar (scenario name, timer, mode badge, End button). Centre: audio-reactive **orb** in monochrome with a soft accent glow that changes with state (listening = calm pulse, thinking = subtle shimmer, speaking = waveform-driven). Captions in a floating card below, agent lines in primary text, my lines in secondary with low-confidence words subtly underlined. Controls as a bottom floating pill bar (mute, push-to-talk, help, repeat, slower, captions, end). Right-side collapsible panel for scenario goal + key phrases. Everything keyboard-accessible (Space = push-to-talk, H = help, Esc = end confirm).

### 13.6 Quality bar

- A `/design` dev-only route renders every component in all states (dark + light) for review.
- Before finishing, take Playwright screenshots of every page in dark mode at 1440px and 390px and save to `docs/screenshots/`. Look at them yourself and fix anything that looks off-brand, misaligned, or unfinished.
- Zero placeholder text, zero default-styled components, zero "TODO UI". Encouraging tone everywhere — scores should motivate, not punish.
- Agent voices: pick natural, warm defaults; offer 4–6 voices (incl. Indian-accented English option if the TTS provider has one; log availability).
- Microcopy for an Indian learner: examples should feel local and realistic (names, companies, cities, cricket, festivals, office culture) without stereotypes.

**Begin now. Start with Phase 0 (install the LiveKit Agent Skills) and do not stop until Phase 12 or you are truly blocked. Log everything.**
