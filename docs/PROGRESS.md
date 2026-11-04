# Progress

Resume rule: read `SPEC.md`, this file and `docs/DECISIONS.md`, then continue from the first phase not marked DONE. Never redo a DONE phase.

## Phase 0 — LiveKit Agent Skills — DONE

- Installed via `npx skills add livekit/agent-skills` → `.claude/skills/*`, `skills-lock.json`. Skills visible in session.
- `lk` 2.19.3 built from source (`/root/go/bin/lk`). `lk docs` blocked by network policy (logged in RESEARCH_NOTES).
- `SPEC.md`, `CLAUDE.md` written for context recovery.

## Phase 1 — Research — DONE

- `docs/RESEARCH_NOTES.md` has verified API shapes (LiveKit Agents 1.8.10, server SDK, components-react) and pinned versions.
- Blockers noted: vendor docs sites unreachable; no provider API keys in sandbox.

## Phase 2 — Scaffold + design system — DONE

- pnpm workspace (`apps/web`, `apps/agent`, `packages/shared`), docker-compose (Postgres, MinIO, optional LiveKit), `.env.example`, Makefile, CI workflow.
- Prisma schema + `init` migration (applied to a local Postgres 16 cluster at `/var/lib/fluent-pg`; Docker daemon is unavailable in the sandbox).
- Shared JSON Schemas → generated TS types (`pnpm shared:gen`) + Pydantic mirrors (`apps/agent/src/fluent_agent/schemas.py`) validated against shared fixtures.
- Geist/Vercel design system: tokens in `globals.css`, Geist fonts, 30+ restyled primitives, app shell (navbar + sliding tab bar + ⌘K), theme toggle, `/design` showcase; screenshots in `docs/screenshots/design-*.png`.
- Agent skeleton: settings (validated), structlog, asyncpg DB layer. `pnpm lint/typecheck/test` and `ruff/mypy/pytest` green.

## Phase 3 — Scenario content — DONE

- 13 themes, **88 scenarios** in `apps/web/prisma/seed-data/*.ts` (rich personas, goals, criteria, vocabulary, mistakes, templates; panel/GD scenarios declare `characters`).
- `prisma/seed.ts` upserts owner + themes + scenarios; validated by `prisma/seed-data/seed-data.test.ts` (schema, counts, unique ids). Seeded into the local DB.
- `docs/SCENARIO_AUTHORING.md` written.

## Phase 4 — Session backend — IN PROGRESS (auth gate, sessions API, LiveKit token/room/dispatch, webhook written; needs verification)

## Phase 5 — Agent MVP — IN PROGRESS (worker, FluentAgent + tools, tracker, scripted LLM written; needs `lk agent debugger` verification)

## Phase 3 — Scenario content

## Phase 4 — Session backend

## Phase 5 — Agent MVP

## Phase 6 — Practice flow UI — DONE

- `/practice` launcher: search, theme chips, difficulty filter, Recommended/Recent/Favourites rows, Quick start card, sticky session config (difficulty, coaching mode, voice, speed, length, captions, key phrases), remembered defaults, favourite toggle (`/api/scenarios/:id/favourite`), settings API.
- Pre-flight dialog (mic permission, device picker, level meter, "say I'm ready" check; skippable; remembered).
- `/practice/[sessionId]`: LiveKit room (RoomContext, RoomAudioRenderer), audio-reactive canvas orb (listening/thinking/speaking), level ring, captions (lk.transcription), goal/criteria/phrases panel, pill controls (mute, push-to-talk, help, repeat, slower, captions, pause, panel, end), keyboard shortcuts (Space/H/C/Esc), timer, reconnect indicator, mic errors, status polling → report redirect; token refresh route for reloads.
- `/sessions/[id]`: analysing skeleton with progress steps, failed state with Retry analysis + Practice again (full report body in Phase 9).
- Screenshots: `docs/screenshots/practice-*.png` (verified live against local LiveKit + agent).

## Phase 7 — Coaching modes, tools, Hinglish, silence, multi-character

## Phase 8 — Analysis engine + agent tests + simulations

## Phase 9 — Dashboard + landing + screenshots

## Phase 10 — Drills

## Phase 11 — Recording/Egress, PDF, goals, settings, usage

## Phase 12 — Hardening + deployment docs + FINAL_REPORT — DONE

- Production build + `next start`; Lighthouse landing 100/100/100/100, dashboard 100/100/100 (SEO 54 by design: noindex); AA contrast fix for tertiary text; heading order; global error boundary; robots/sitemap; Playwright smoke spec (3 passing); 33 screenshots in `docs/screenshots/`.
- `apps/agent/Dockerfile`, docker-compose `agent` profile, `docs/DEPLOYMENT.md` (LiveKit Cloud deploy/rollback/secrets, prewarm, drain, load, upgrades), `docs/ARCHITECTURE.md` (Mermaid), `README.md`, `docs/FINAL_REPORT.md`.

## Incomplete / TODO

- (none yet)
