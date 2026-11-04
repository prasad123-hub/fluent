# Deployment

Three deployables: the **web app** (Next.js), the **agent worker** (Python, LiveKit Agents) and **Postgres**.
LiveKit itself is LiveKit Cloud by default (or the `docker compose --profile livekit` server for dev).
CLI commands below were verified against `lk` 2.19.3 (`lk agent --help`).

## 1. Database — Neon or Vercel Postgres (or any Postgres 16)

1. Create a database; copy the pooled connection string into `DATABASE_URL`.
2. From a machine with the repo: `pnpm install && pnpm --filter @fluent/web db:migrate` (applies `prisma/migrations`),
   then `pnpm db:seed` (owner row, 13 themes, 88 scenarios). Re-running is safe (upserts).
3. Both the web app and the agent use the same `DATABASE_URL`. The agent opens a small asyncpg pool (max 4).

## 2. Web app — Vercel

1. Import the repo; set **Root Directory** = `apps/web`, framework Next.js, install command `pnpm install --frozen-lockfile`
   (run from the monorepo root — Vercel detects pnpm workspaces), build command `pnpm --filter @fluent/web build`
   (the `build` script runs `prisma generate` first).
2. Environment variables (Production + Preview): everything in `.env.example` that applies — `DATABASE_URL`,
   `OWNER_EMAIL`, `OWNER_PASSWORD_HASH` (paste the **raw** bcrypt hash; dashboards do not expand `$`),
   `OWNER_NAME`, `AUTH_SECRET` (`openssl rand -base64 32`), `NEXT_PUBLIC_APP_URL`, `LIVEKIT_URL`, `LIVEKIT_API_KEY`,
   `LIVEKIT_API_SECRET`, `LIVEKIT_AGENT_NAME=fluent-agent`, optional `OPENAI_API_KEY` (custom-scenario generator),
   `RECORDINGS_ENABLED` + `S3_*` (optional), `RESEND_API_KEY` + `REMINDER_FROM_EMAIL` (optional),
   `FLUENT_MAX_SESSION_MINUTES`, `FLUENT_MAX_DAILY_MINUTES`.
3. LiveKit webhook: in LiveKit Cloud → Settings → Webhooks add `https://<your-domain>/api/livekit/webhook`
   (signed with the same API key/secret; the route verifies the signature).
4. Security headers, `poweredByHeader: false` and the auth middleware are already configured in `next.config.ts`
   / `src/middleware.ts`. Every page and API except `/`, `/login`, `/api/auth/*`, `/api/livekit/webhook` requires login.

## 3. Agent worker

### Option A — LiveKit Cloud agent hosting (recommended)

The worker ships as a container; LiveKit Cloud builds it from the Dockerfile and runs it next to the media servers.

```bash
cd apps/agent
lk cloud auth                                   # once: link the CLI to your project
lk agent create --region <region> \
  --secrets-file ../../.env.agent               # creates livekit.toml + first deploy
lk agent status                                 # rollout state
lk agent logs                                   # tail logs (build logs and deploy logs are separate)
```

`.env.agent` holds only the agent's secrets: `DATABASE_URL`, `DEEPGRAM_API_KEY`, `OPENAI_API_KEY` (or
`ANTHROPIC_API_KEY`), `CARTESIA_API_KEY` (or `ELEVENLABS_API_KEY`), `FLUENT_LLM_PROVIDER`, `FLUENT_LLM_MODEL`,
`FLUENT_TTS_PROVIDER`, `FLUENT_STT_PROVIDER`, `FLUENT_ANALYSIS_MODEL`, `LIVEKIT_AGENT_NAME=fluent-agent`,
`FLUENT_MAX_SESSION_MINUTES`, `FLUENT_MAX_DAILY_MINUTES`, `LOG_FORMAT=json`. Never set `FLUENT_FAKE_LLM`,
`FLUENT_FIXED_LOAD` or `FLUENT_TURN_DETECTOR=vad` in production. LiveKit credentials are injected by the platform.

Ship a new version:

```bash
lk agent deploy                                 # builds apps/agent/Dockerfile, rolls out, records git commit as attributes
lk agent versions                               # list versions
lk agent rollback --version <version>           # instant return to a previous version
lk agent update-secrets --secrets OPENAI_API_KEY=...   # restarts the agent
```

Run `lk agent start` locally before the first deploy: it is production mode (prewarmed processes, load
reporting, drain on SIGTERM) and is **not** what `dev` runs. Then smoke-test the deployed agent by name:
`lk agent simulate text --scenarios scenarios/smoke.yaml --agent-name fluent-agent --yes`.

### Option B — Fly.io / Railway / any Docker host

```bash
docker build -f apps/agent/Dockerfile -t fluent-agent .        # from the repo root
docker run --env-file .env.agent -e LIVEKIT_URL=wss://<project>.livekit.cloud \
  -e LIVEKIT_API_KEY=... -e LIVEKIT_API_SECRET=... -p 8081:8081 fluent-agent
```

The worker registers with LiveKit over an outbound WebSocket, so no inbound ports are needed except the
health endpoint (`:8081`). Run at least two replicas for zero-downtime deploys; each worker handles several
sessions (one job process per session).

Also run the **analysis worker** as a second process of the same image:
`docker run --env-file .env.agent fluent-agent analysis-worker --watch` (or a second Fly process group). It only
needs `DATABASE_URL` and the LLM key; it retries sessions whose hosting worker died and serves the dashboard's
"Retry analysis" button.

## 4. Operating the worker (from the `operating-livekit-agents` skill)

- **Prewarm**: `AgentServer(setup_fnc=prewarm)` loads Silero VAD once per process; job processes inherit it.
  The Dockerfile also pre-downloads the turn-detector weights so a cold start does not block on a download.
- **Process model**: production mode keeps `num_idle_processes` warm (defaults to CPU count); size the host
  with ~0.5 vCPU and ~400 MB RAM per concurrent session plus the warm pool.
- **Timeouts / degradation**: every provider plugin has connect/retry options (`APIConnectOptions`); the worker
  falls back across TTS providers at construction time when a key is missing, and errors in a tool are
  surfaced to the model as `ToolError` text so the learner hears something rather than silence.
  `session_end_timeout=300` bounds the post-session analysis; sessions still `analyzing` after 5 minutes are
  marked failed with a Retry button.
- **Graceful shutdown**: SIGTERM starts a drain (`drain_timeout=90` s): no new jobs, running sessions finish,
  `on_session_end` (analysis) completes inside the drain. Set the orchestrator's grace period ≥ 90 s
  (`kill_timeout` on Fly, `terminationGracePeriodSeconds` on Kubernetes) or sessions get cut mid-sentence.
- **Load reporting**: LiveKit assigns jobs by `target_load − reported_load`. Leave the default CPU-based load
  function in production; `FLUENT_FIXED_LOAD` exists only for single-worker dev boxes.
- **Observability**: logs are JSON (`LOG_FORMAT=json`) and every line carries `session_id` and `room`; per-turn
  latency (`e2e_latency`, `llm_node_ttft`, `tts_node_ttfb`, …) is persisted per utterance and shown at
  `/admin/health` (p50/p95, last 7 days). LiveKit Cloud additionally records session traces when
  `record=True` is passed to `session.start` (currently `False`; flip it when you want Cloud transcripts).
- **Upgrading the SDK**: pin `livekit-agents` (currently 1.8.10). Upgrade on a branch: `uv lock --upgrade-package
livekit-agents`, run `uv run pytest`, drive a conversation with `lk agent debugger`, run the simulations, then
  deploy and watch `/admin/health` latency for the first hour. Read the changelog first (`lk docs` /
  docs.livekit.io) — the `turn_detector` plugin, for example, was deprecated in favour of `inference.TurnDetector`.
- **Rollback**: `lk agent rollback --version <v>` on Cloud; on Docker hosts redeploy the previous image tag.

## 5. Self-hosted LiveKit (optional)

`docker compose --profile livekit up -d` starts `livekit/livekit-server --dev` with the `devkey`/`secret`
pair; set `LIVEKIT_URL=ws://localhost:7880`. Egress and Krisp noise cancellation are Cloud features; the app
degrades gracefully without them (recordings off, browser noise suppression only).

## 6. Local full stack

```bash
cp .env.example .env            # fill in keys; hash the password with `pnpm --filter @fluent/web hash-password`
docker compose up -d            # Postgres + MinIO
pnpm install && pnpm db:migrate && pnpm db:seed && pnpm seed:demo
pnpm dev                        # http://localhost:3000
cd apps/agent && uv sync --all-extras && uv run agent dev
```
