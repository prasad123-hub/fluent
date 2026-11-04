# Fluent

Fluent is a personal, single-user web app for practising **spoken English and communication skills** with a
real-time AI voice coach built on [LiveKit](https://livekit.io). You pick a scenario (interviews, office,
daily life, debates, exams, pronunciation drills…), talk to the agent, and get a deep analysis of your spoken
English after every session on a Vercel-style dashboard: scores, CEFR level, grammar errors, filler words,
pace, pronunciation flags, vocabulary, "say it better" rewrites and personalised drills. It understands
Hindi/Hinglish code-switching and nudges you back to English without ever shaming you.

- `apps/web` — Next.js 15 (App Router, Tailwind v4, Geist design system), Prisma, Auth.js single-owner login
- `apps/agent` — Python LiveKit Agents worker (Deepgram · OpenAI/Anthropic · Cartesia/ElevenLabs/OpenAI TTS ·
  Silero VAD · LiveKit turn detector) + the analysis engine
- `packages/shared` — JSON Schemas shared by TypeScript and Pydantic

Docs: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · [`docs/SCORING.md`](docs/SCORING.md) ·
[`docs/SCENARIO_AUTHORING.md`](docs/SCENARIO_AUTHORING.md) · [`docs/COACHING_MODES.md`](docs/COACHING_MODES.md) ·
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) · [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) ·
[`docs/RESEARCH_NOTES.md`](docs/RESEARCH_NOTES.md) · [`docs/DECISIONS.md`](docs/DECISIONS.md) ·
[`docs/PROGRESS.md`](docs/PROGRESS.md) · [`docs/FINAL_REPORT.md`](docs/FINAL_REPORT.md)

## Quick start (local)

Prerequisites: Node 22 + pnpm 10, Python 3.11–3.13 + [uv](https://docs.astral.sh/uv/), Docker (for Postgres/MinIO),
a LiveKit project (Cloud, or the bundled self-hosted server), and API keys for Deepgram, OpenAI (or Anthropic)
and Cartesia (or ElevenLabs / OpenAI TTS).

```bash
cp .env.example .env
pnpm --filter @fluent/web hash-password "your password"   # paste the printed OWNER_PASSWORD_HASH line into .env
docker compose up -d                                       # Postgres + MinIO (add --profile livekit for a local LiveKit server)
pnpm install
pnpm db:migrate && pnpm db:seed                            # schema + owner + 13 themes / 88 scenarios
pnpm seed:demo                                             # optional: 8 realistic demo sessions with reports
pnpm dev                                                   # web app → http://localhost:3000
```

In a second terminal:

```bash
cd apps/agent && uv sync --all-extras && uv run agent dev   # voice agent worker (registers as "fluent-agent")
```

Log in with `OWNER_EMAIL` / your password → **Practice** → pick a scenario → talk. End the session and the
report appears within about a minute.

Optional third process for analysis retries: `cd apps/agent && uv run analysis-worker --watch`.

### Running without API keys

The agent and the analysis engine have a deterministic scripted mode for development and tests:
`FLUENT_FAKE_LLM=1 FLUENT_TURN_DETECTOR=vad uv run agent dev`. You still need LiveKit (local server is fine) and
a microphone for audio; without STT/TTS keys the agent works in text mode (`lk agent debugger`).

## Everyday commands

| Command                                                                    | What it does                                                                                    |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `pnpm dev` / `pnpm build`                                                  | Web app                                                                                         |
| `pnpm lint` · `pnpm typecheck` · `pnpm test`                               | ESLint, `tsc`, Vitest (web + shared)                                                            |
| `pnpm db:migrate` · `pnpm db:seed` · `pnpm seed:demo`                      | Migrations, scenario seed, demo sessions                                                        |
| `pnpm screenshots`                                                         | Playwright screenshots of every page → `docs/screenshots` (needs a running app, `E2E_PASSWORD`) |
| `cd apps/agent && uv run agent dev`                                        | Agent worker (dev mode, hot reload)                                                             |
| `cd apps/agent && uv run ruff check . && uv run mypy src && uv run pytest` | Agent lint, types, tests                                                                        |
| `cd apps/agent && lk agent debugger start` → `lk agent debugger say "…"`   | Drive the agent turn by turn (text)                                                             |
| `cd apps/agent && lk agent simulate text --scenarios scenarios/smoke.yaml` | Judged simulations on LiveKit Cloud                                                             |
| `make ci`                                                                  | Everything CI runs                                                                              |

## Environment

Every variable is documented in [`.env.example`](.env.example). Required: `DATABASE_URL`, `OWNER_EMAIL`,
`OWNER_PASSWORD_HASH`, `AUTH_SECRET`, `LIVEKIT_URL/API_KEY/API_SECRET`, plus provider keys for the agent.
Optional and gracefully degraded: recordings (`RECORDINGS_ENABLED` + S3/MinIO), email reminders (Resend).

Bcrypt hashes contain `$`; in `.env` files escape them as `\$` (the hash script prints the escaped form).

## Project layout

```
apps/web/        Next.js app: src/app (routes), src/components (ui, shell, practice, report, dashboard, charts), src/lib, prisma/
apps/agent/      Python worker: src/fluent_agent (main, prompt, providers, tracker, db, analysis/), tests/, scenarios/
packages/shared/ JSON Schemas → generated TS types; fixtures used by both test suites
docs/            Architecture, scoring, authoring, deployment, decisions, progress, screenshots
```

## License

Private project.
