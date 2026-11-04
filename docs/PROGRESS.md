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

## Phase 3 — Scenario content — NEXT

## Phase 3 — Scenario content

## Phase 4 — Session backend

## Phase 5 — Agent MVP

## Phase 6 — Practice flow UI

## Phase 7 — Coaching modes, tools, Hinglish, silence, multi-character

## Phase 8 — Analysis engine + agent tests + simulations

## Phase 9 — Dashboard + landing + screenshots

## Phase 10 — Drills

## Phase 11 — Recording/Egress, PDF, goals, settings, usage

## Phase 12 — Hardening + deployment docs + FINAL_REPORT

## Incomplete / TODO

- (none yet)
