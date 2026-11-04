# Decisions log

One line each: decision + reason. Newest at the bottom.

- Skills installed with `npx skills add livekit/agent-skills` (project `.claude/skills/`), not the plugin or `lk skills` — one method only, as required.
- `lk` CLI built from source (2.19.3) because `get.livekit.io` and GitHub release downloads are blocked by the sandbox network policy.
- LiveKit docs source = pinned SDK source (`livekit-agents==1.8.10`) + examples + `lk --help`, because `docs.livekit.io` (Docs MCP, `lk docs`, `llms.txt`) is unreachable from this sandbox.
- Next.js pinned to 15.5.x (spec says 15; 16.x exists but its breaking changes cannot be verified offline).
- TypeScript 5.9.x (7.x is the native preview; tooling compatibility unverified).
- Prisma 6.19.x (7.x needs driver adapters + `prisma.config.ts`; docs unreachable; 6.x is boring and stable).
- Auth.js v5 (`next-auth@5.0.0-beta.32`) because it is the App-Router-native line (`auth()`, `handlers`, proxy-less middleware); v4 targets the pages router.
- Agent ↔ DB: the Python worker writes **directly to Postgres with `asyncpg`** (parameterized SQL against the Prisma-managed schema); Prisma owns migrations. Chosen over SQLAlchemy/HTTP API for fewer moving parts and no second schema definition.
- Agent dispatch: explicit dispatch (`agent_name="fluent-agent"`) with session config in **dispatch metadata** (`ctx.job.metadata`); the same JSON is also written to room metadata as a fallback.
- Turn detection: `livekit.agents.inference.TurnDetector` (the `turn_detector` plugin is deprecated in 1.8.10); VAD: `silero.VAD.load()` in prewarm.
- Official Geist React components (`@vercel/geistcn`) are not on npm → Geist look rebuilt on shadcn/ui primitives + Tailwind v4 tokens.
- Recharts 2.15.x, zod 3.x, TanStack Table 8.x, `motion` 14 — known stable APIs; newer majors unverifiable offline.
- No provider API keys exist in the build sandbox → the agent ships a deterministic **scripted LLM mode** (`FLUENT_FAKE_LLM=1`) so `lk agent debugger`, pytest and plumbing checks run key-free; real-model behaviour is verified when keys are present.
- Analysis runs inside the agent worker in `on_session_end` (bounded by `session_end_timeout`), with a Postgres-backed retry path (`POST /api/sessions/:id/retry-analysis`) as the safety net — no queue/Redis.
