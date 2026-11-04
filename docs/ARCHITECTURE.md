# Architecture

Fluent is a single-user web app (Next.js) plus a Python voice-agent worker (LiveKit Agents), sharing one
Postgres database. LiveKit carries the real-time audio; the agent runs the STT → LLM → TTS pipeline, logs
every utterance with word timings, and analyses the session when it ends.

```mermaid
flowchart LR
  subgraph Browser
    UI[Next.js app<br/>Practice page · Dashboard]
  end
  subgraph Web["apps/web (Next.js 15)"]
    API[Route handlers<br/>/api/sessions · /api/livekit/webhook · …]
    AUTH[Auth.js credentials<br/>single owner]
    PRISMA[(Prisma)]
  end
  subgraph LK["LiveKit (Cloud or self-hosted)"]
    ROOM[Private room<br/>1 learner + 1 agent]
    DISPATCH[Explicit agent dispatch<br/>metadata = session config]
  end
  subgraph Agent["apps/agent (Python, livekit-agents 1.8)"]
    WORKER[AgentServer worker]
    SESSION[AgentSession<br/>Deepgram STT · OpenAI/Anthropic LLM · Cartesia/ElevenLabs/OpenAI TTS · Silero VAD · turn detector]
    TOOLS[FluentAgent tools<br/>give_hint · log_correction · switch_persona · …]
    TRACK[SessionTracker<br/>utterances · words · events · latency]
    ANALYSIS[Analysis pipeline<br/>metrics.py · rubric.py · scoring.py · profile.py]
    AW[analysis-worker<br/>retries / demo seed]
  end
  DB[(PostgreSQL)]
  S3[(S3 / MinIO<br/>optional recordings)]

  UI -- "POST /api/sessions" --> API
  API -- "create room + dispatch" --> DISPATCH
  API -- "join token" --> UI
  UI <-- "WebRTC audio · lk.transcription · lk.chat" --> ROOM
  DISPATCH --> WORKER --> SESSION --> ROOM
  SESSION --> TOOLS --> TRACK
  TRACK -- "asyncpg, incremental" --> DB
  SESSION -- "on_session_end" --> ANALYSIS --> DB
  AW --> ANALYSIS
  API --> PRISMA --> DB
  AUTH --> PRISMA
  ROOM -. "webhook room_finished (safety net)" .-> API
  ROOM -. "Egress (optional)" .-> S3
  UI -- "poll GET /api/sessions/:id" --> API
```

## Session lifecycle

1. **Create** — `POST /api/sessions` validates the config (zod), enforces the daily-minutes cap, supersedes any
   still-live session, creates `Session{status: starting}`, creates a private LiveKit room (max 2 participants),
   explicitly dispatches `fluent-agent` with the session config as dispatch metadata, mints a short-lived join
   token for the owner, and optionally starts an audio-only Egress recording.
2. **Live** — the Practice page joins the room. The agent worker receives the job, loads the scenario and learner
   profile from Postgres, builds instructions (`prompt.py`), greets with `session.say(agentOpeningLine)` and marks
   the session `live` (only if still `starting`). Every final transcript, agent turn, tool call, interruption,
   hint, code-switch and latency sample is written incrementally through `SessionTracker`.
3. **End** — the learner presses End (`POST /api/sessions/:id/end` → status `analyzing`, room deleted), the session
   timer fires, the learner goes away for 2 minutes, or the agent calls `end_session_with_summary`. The agent's
   `on_session_end` hook finalises the row and runs the analysis pipeline. The LiveKit webhook (`room_finished`)
   is the safety net that moves a stuck `live` session forward; the web app sweeps sessions stuck in `analyzing`
   for more than five minutes to `failed` with a Retry button; `analysis-worker --watch` retries them.
4. **Report** — `AnalysisReport` (JSONB + normalised `MetricPoint`, `GrammarError`, `VocabEntry` rows) and the
   `UserProfile` are upserted; the report page polls until `complete` and renders.

## Data model

See `apps/web/prisma/schema.prisma` (mirrored for the agent in `apps/agent/src/fluent_agent/schemas.py`;
the shared JSON Schemas in `packages/shared/schemas` are the contract between the two, validated by tests on
both sides). Prisma owns migrations; the agent uses asyncpg with the same column names.

## Where things live

| Concern                           | Path                                                                                           |
| --------------------------------- | ---------------------------------------------------------------------------------------------- |
| Design system tokens / primitives | `apps/web/src/app/globals.css`, `apps/web/src/components/ui`                                   |
| App shell (navbar, tab bar, ⌘K)   | `apps/web/src/components/shell`                                                                |
| Practice flow                     | `apps/web/src/components/practice`, `apps/web/src/app/(app)/practice`                          |
| Session backend                   | `apps/web/src/lib/sessions.ts`, `apps/web/src/lib/livekit.ts`, `apps/web/src/app/api/sessions` |
| Dashboard queries                 | `apps/web/src/lib/queries`                                                                     |
| Agent worker                      | `apps/agent/src/fluent_agent/main.py` (entrypoint, tools, watchdog)                            |
| Providers / voices                | `apps/agent/src/fluent_agent/providers.py`                                                     |
| Persistence from the agent        | `apps/agent/src/fluent_agent/tracker.py`, `db.py`                                              |
| Analysis                          | `apps/agent/src/fluent_agent/analysis/`                                                        |
| Scenario content                  | `apps/web/prisma/seed-data/`                                                                   |
| Simulations                       | `apps/agent/scenarios/*.yaml`                                                                  |
