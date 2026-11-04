# Final report — Fluent

_Written at the end of the autonomous build. Status of every phase is in `docs/PROGRESS.md`; decisions in
`docs/DECISIONS.md`._

## What was built

**A production-shaped, single-user voice English coach** on LiveKit, Next.js 15 and Python:

- **Web app** (`apps/web`): Vercel/Geist design system (dark-first, 30+ restyled primitives, navbar + sliding tab
  bar, ⌘K), single-owner login (Auth.js v5, bcrypt, rate-limited), Practice launcher (search, themes, levels,
  recommended/recent/favourites, quick start, remembered defaults, pre-flight mic check), live Practice page
  (audio-reactive orb, captions, goal/phrases panel, pill controls, push-to-talk, keyboard shortcuts, reconnect
  handling), Session Report (score cards, summary, radar, transcript with inline corrections and low-confidence
  underlines, synced audio when recordings exist, grammar table, fluency timeline/heatmap, communication and
  interview/IELTS lenses, vocabulary bank, task criteria, next drills, PDF/transcript export), Dashboard tabs
  (Overview, Progress, Sessions, Mistakes, Vocabulary with SM-2 flashcards + voice flashcards, Pronunciation lab,
  Goals, Settings with usage/cost, export and clear-data), Scenario Library with a custom-scenario builder,
  landing page with OG image, `/admin/health` latency panel, `/design` showcase.
- **Agent worker** (`apps/agent`): LiveKit Agents 1.8.10 `AgentServer` with explicit dispatch, Deepgram STT with
  word timings, OpenAI/Anthropic LLM, Cartesia/ElevenLabs/OpenAI TTS, Silero VAD, LiveKit turn detector,
  11 function tools, five coaching modes, difficulty controls, learner-profile injection, Hinglish detection,
  silence/timer/inactivity handling, multi-character persona switching, incremental persistence of every
  utterance/word/event/latency sample, and the analysis engine (deterministic metrics + schema-strict LLM judge +
  documented scoring + learner profile) that runs on session end, plus an `analysis-worker` for retries.
- **Content**: 13 themes, 88 scenarios with rich personas, goals, criteria, vocabulary and prompt templates.
- **Tests & tooling**: Vitest (web/shared), 41 pytest tests (metrics, rubric with mocked provider, scoring,
  profile, DB pipeline, turn-level agent tests with a scripted LLM), simulation scenario files, CI workflow,
  Playwright smoke spec and screenshot script, Dockerfile, docker-compose, deployment guide.

## How to run it

See `README.md` (Quick start) and `docs/DEPLOYMENT.md`. Short version:

```bash
cp .env.example .env && pnpm --filter @fluent/web hash-password "your password"
docker compose up -d && pnpm install && pnpm db:migrate && pnpm db:seed && pnpm seed:demo
pnpm dev                                   # web
cd apps/agent && uv sync --all-extras && uv run agent dev   # agent
```

## How it was verified (in the sandbox)

- Design system, launcher, live practice page, dashboard tabs and report reviewed from Playwright screenshots
  at 1440 px and 390 px (`docs/screenshots/`).
- Session backend verified end-to-end against a locally built `livekit-server --dev` and the real worker: login
  → create session → agent joins → live → learner text turns (lk.chat) → room closed → analysis → `complete`
  with a persisted report in < 0.5 s.
- Agent behaviour verified with `lk agent debugger` per coaching mode (`docs/COACHING_MODES.md`).

## What is incomplete / could not be verified here (and why)

REPLACED_AT_END

## Known bugs / rough edges

REPLACED_AT_END

## First 5 things to do when you wake up

REPLACED_AT_END
