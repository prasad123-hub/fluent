# Fluent — working notes for Claude Code

Full spec in `SPEC.md`. Before starting any phase, and immediately after any context
compaction, re-read `SPEC.md`, `docs/PROGRESS.md` and `docs/DECISIONS.md`, then continue
from the next unfinished phase. Never redo a completed phase.

## Ground rules (summary — SPEC.md is authoritative)

- Work autonomously; never stop to ask. Ambiguity → decide, log one line in `docs/DECISIONS.md`.
- LiveKit facts come from the installed skills (`.claude/skills/*`) and the SDK source /
  docs lookups recorded in `docs/RESEARCH_NOTES.md`, never from memory.
- After each phase: lint + type-check + tests → fix → `git commit` → append to `docs/PROGRESS.md`.
- Tests never need real API keys. Secrets only in `.env` (never committed); `.env.example` lists all.
- Never leave the repo broken. Stub cleanly with `TODO(phase-N)` and log under "Incomplete".
- Single user. No multi-user / join / invite / lobby UI anywhere.
- Vercel / Geist design system, dark-first (SPEC.md §13) is mandatory.

## Layout

- `apps/web` — Next.js 15 App Router + Tailwind v4 + shadcn/ui (Geist-styled), Prisma.
- `apps/agent` — Python (uv) LiveKit Agents worker + analysis engine.
- `packages/shared` — JSON schemas shared by TS and Pydantic.
- `docs/` — PROGRESS, DECISIONS, RESEARCH_NOTES, ARCHITECTURE, SCORING, etc.

## Commands

- `pnpm install && docker compose up -d && pnpm db:migrate && pnpm db:seed`
- `pnpm dev` (web) · `cd apps/agent && uv run agent dev` (agent)
- `pnpm lint && pnpm typecheck && pnpm test` · `cd apps/agent && uv run ruff check . && uv run pytest`
