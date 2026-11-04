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
- Lighthouse (desktop, production build): landing 100/100/100/100, dashboard 100/100/100/54 (see below), login 100/100/100/91.
- CI-equivalent run: ESLint, `tsc`, Vitest (29 tests), ruff, mypy, pytest (41 tests), Playwright smoke (3 tests) — all green.

## What is incomplete / could not be verified here (and why)

- **Real model providers were never exercised.** The sandbox has no OpenAI/Anthropic/Deepgram/Cartesia/ElevenLabs keys
  and blocks their hosts. Everything that touches a provider was verified in **scripted mode** (`FLUENT_FAKE_LLM=1`):
  tool selection, corrections, hints, persona switching, timers, persistence, the analysis pipeline and the dashboards.
  Mode-specific _wording_ (Gentle recasts vs Active tips), real STT word timings, TTS speed changes and the
  model judge's rubric output are implemented against the verified SDK signatures but untested with a real model.
- **No audio was exercised end-to-end.** The live Practice page was tested with Chromium's fake microphone and
  learner turns sent as text (`lk.chat`), which the agent handles through the same turn pipeline. Interruptions,
  VAD/turn-detector tuning and Krisp need a real microphone and a LiveKit Cloud project.
- **LiveKit Cloud simulations did not run** (`lk agent simulate` needs Cloud; `docs.livekit.io` was blocked). The
  scenario files (`apps/agent/scenarios/smoke.yaml`, `guardrails.yaml`), the agent-side `simulation_context()`
  seeding and `on_simulation_end` veto are in place; the CI job runs them on `main` once `LIVEKIT_*`/`OPENAI_API_KEY`
  secrets exist. Scenario ids are added by the CLI on first run (`--yes`).
- **Voice presets map to one verified Cartesia voice id** (the plugin default) because Cartesia's voice library
  was unreachable; set `FLUENT_VOICE_<PRESET>_CARTESIA` (Indian-accented voices exist in Cartesia's library).
- **Docker images were not built** (no Docker daemon in the sandbox): Postgres ran as a local cluster instead of
  the compose service, MinIO/Egress recording was not exercised (code path degrades to "no recording").
- **Email reminders** (Resend) are implemented but untested (no key).
- **Lighthouse**: landing 100/100/100/100; dashboard 100/100/100 with SEO 54 — by design the dashboard is
  `noindex` + disallowed in `robots.txt`, which Lighthouse penalises (plus a Next 15 streamed-metadata quirk on
  the meta-description audit). Login page: 100/100/100/91.
- **Agent tests that need a real LLM** (judge-based `.judge(llm, intent=…)`) were not written; the turn-level
  suite uses the scripted LLM (structural assertions only), as the testing skill recommends for per-commit runs.

## Known bugs / rough edges

- The scripted judge scores demo sessions uniformly high (80–85); numbers only become meaningful with a real model.
- In text-only runs the silence prompt fires ~6 s after the greeting because no audio state changes occur; with audio
  the watchdog resets on `user_state` transitions as intended.
- Vocabulary-bank entries from the scripted judge carry placeholder definitions ("look up a precise definition") until a
  real model fills them; the SM-2 flashcards work regardless.
- Demo transcripts have randomised STT confidences, so some low-confidence underlines land on common words.
- `uv run agent dev` inside this sandbox needs `HTTP(S)_PROXY` unset (local `ws://` through the egress proxy returns 405);
  irrelevant on a normal machine.
- Running `next build` while `next dev` serves the same `.next` directory breaks the dev server (happened once during the
  parallel UI work); restart `pnpm dev` if you see a global 500.
- `/admin/health` only has latency samples from text-mode turns so far (LLM TTFT ≈ 1 ms with the scripted model).

## First 5 things to do when you wake up

1. **Add real keys and run one real session.** In `.env`: `OPENAI_API_KEY`, `DEEPGRAM_API_KEY`, `CARTESIA_API_KEY`
   (or ElevenLabs/OpenAI TTS), LiveKit Cloud `LIVEKIT_URL/API_KEY/API_SECRET`; remove `FLUENT_FAKE_LLM`,
   `FLUENT_FIXED_LOAD` and `FLUENT_TURN_DETECTOR=vad`. Then `pnpm dev` + `cd apps/agent && uv run agent dev`,
   log in, Practice → "HR screening: tell me about yourself", talk, press Help, end, read the report.
2. **Pick voices.** Choose Indian-accented Cartesia voices and set `FLUENT_VOICE_PRIYA_CARTESIA=…` etc.
   (`apps/agent/src/fluent_agent/providers.py` → `VOICE_PRESETS`).
3. **Run the simulations against Cloud**: `cd apps/agent && lk agent simulate text --scenarios scenarios/smoke.yaml --yes`,
   then compare the real transcripts with `docs/COACHING_MODES.md` and tune `prompt.py` blocks.
4. **Review the screenshots** in `docs/screenshots/` and the copy on the landing page / report; adjust the scoring
   weights in `docs/SCORING.md` once you have a few real reports.
5. **Deploy**: Neon (`pnpm db:migrate && pnpm db:seed`), Vercel (`apps/web`), LiveKit Cloud agent (`lk agent create`),
   the webhook URL, and a second `analysis-worker --watch` process — all in `docs/DEPLOYMENT.md`.
