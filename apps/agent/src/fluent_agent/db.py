"""asyncpg access to the Prisma-managed Postgres schema.

Prisma owns migrations; this module only reads/writes rows. Column names match the
Prisma models exactly (Prisma uses camelCase column names by default).
"""

from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import Any

import asyncpg

from .log import get_logger

log = get_logger("db")


def _cuid() -> str:
    # Prisma-compatible enough: 25 chars, starts with 'c'. Collisions are practically impossible.
    import secrets

    return "c" + secrets.token_hex(12)


class Database:
    def __init__(self, dsn: str, *, min_size: int = 1, max_size: int = 4) -> None:
        self._dsn = dsn
        self._min = min_size
        self._max = max_size
        self._pool: asyncpg.Pool | None = None

    async def connect(self) -> None:
        if self._pool is None:
            self._pool = await asyncpg.create_pool(
                self._dsn, min_size=self._min, max_size=self._max, init=_init_conn
            )

    async def close(self) -> None:
        if self._pool is not None:
            await self._pool.close()
            self._pool = None

    @property
    def pool(self) -> asyncpg.Pool:
        if self._pool is None:
            raise RuntimeError("Database not connected")
        return self._pool

    # ── sessions ──────────────────────────────────────────────────────────

    async def get_session(self, session_id: str) -> dict[str, Any] | None:
        row = await self.pool.fetchrow('SELECT * FROM "Session" WHERE id = $1', session_id)
        return dict(row) if row else None

    async def get_scenario(self, scenario_id: str) -> dict[str, Any] | None:
        row = await self.pool.fetchrow(
            'SELECT s.*, t.slug AS "themeSlug" FROM "Scenario" s JOIN "Theme" t ON t.id = s."themeId" WHERE s.id = $1',
            scenario_id,
        )
        return dict(row) if row else None

    async def get_profile(self, user_id: str) -> dict[str, Any] | None:
        row = await self.pool.fetchrow('SELECT * FROM "UserProfile" WHERE "userId" = $1', user_id)
        return dict(row) if row else None

    async def set_session_status(self, session_id: str, status: str, **fields: Any) -> None:
        sets = ['status = $2::"SessionStatus"', '"updatedAt" = now()']
        args: list[Any] = [session_id, status]
        for k, v in fields.items():
            args.append(v)
            sets.append(f'"{k}" = ${len(args)}')
        await self.pool.execute(f'UPDATE "Session" SET {", ".join(sets)} WHERE id = $1', *args)

    async def mark_live(self, session_id: str) -> None:
        await self.set_session_status(session_id, "live", startedAt=datetime.now(UTC))

    async def mark_ended(self, session_id: str, *, reason: str, duration_sec: int) -> None:
        await self.set_session_status(
            session_id,
            "analyzing",
            endedAt=datetime.now(UTC),
            endReason=reason,
            durationSec=duration_sec,
            analysisStartedAt=datetime.now(UTC),
        )
        await self.pool.execute(
            'UPDATE "Session" SET "analysisAttempts" = "analysisAttempts" + 1 WHERE id = $1',
            session_id,
        )

    # ── utterances & events (incremental persistence) ─────────────────────

    async def insert_utterance(
        self,
        session_id: str,
        *,
        seq: int,
        speaker: str,
        text: str,
        start_ms: int,
        end_ms: int,
        words: list[dict[str, Any]] | None = None,
        confidence: float | None = None,
        filler_count: int = 0,
        interrupted: bool = False,
        agent_character: str | None = None,
        metrics: dict[str, Any] | None = None,
    ) -> str:
        uid = _cuid()
        await self.pool.execute(
            'INSERT INTO "Utterance" (id, "sessionId", seq, speaker, "agentCharacter", text, "startMs", "endMs", words, confidence, "fillerCount", interrupted, metrics) '
            'VALUES ($1, $2, $3, $4::"Speaker", $5, $6, $7, $8, $9::jsonb, $10, $11, $12, $13::jsonb) '
            'ON CONFLICT ("sessionId", seq) DO UPDATE SET text = EXCLUDED.text, "endMs" = EXCLUDED."endMs", words = EXCLUDED.words, confidence = EXCLUDED.confidence, "fillerCount" = EXCLUDED."fillerCount", interrupted = EXCLUDED.interrupted, metrics = EXCLUDED.metrics',
            uid,
            session_id,
            seq,
            speaker,
            agent_character,
            text,
            start_ms,
            end_ms,
            json.dumps(words) if words is not None else None,
            confidence,
            filler_count,
            interrupted,
            json.dumps(metrics) if metrics is not None else None,
        )
        return uid

    async def insert_event(
        self, session_id: str, *, type_: str, at_ms: int, payload: dict[str, Any]
    ) -> None:
        await self.pool.execute(
            'INSERT INTO "SessionEvent" (id, "sessionId", type, "atMs", payload) VALUES ($1, $2, $3::"SessionEventType", $4, $5::jsonb)',
            _cuid(),
            session_id,
            type_,
            at_ms,
            json.dumps(payload),
        )

    async def list_utterances(self, session_id: str) -> list[dict[str, Any]]:
        rows = await self.pool.fetch(
            'SELECT * FROM "Utterance" WHERE "sessionId" = $1 ORDER BY seq', session_id
        )
        return [dict(r) for r in rows]

    async def list_events(self, session_id: str) -> list[dict[str, Any]]:
        rows = await self.pool.fetch(
            'SELECT * FROM "SessionEvent" WHERE "sessionId" = $1 ORDER BY "atMs"', session_id
        )
        return [dict(r) for r in rows]

    async def insert_usage(
        self,
        session_id: str | None,
        *,
        provider: str,
        kind: str,
        model: str | None,
        input_tokens: int = 0,
        output_tokens: int = 0,
        characters: int = 0,
        audio_seconds: float = 0.0,
        cost_usd: float = 0.0,
    ) -> None:
        await self.pool.execute(
            'INSERT INTO "UsageLog" (id, "sessionId", provider, kind, model, "inputTokens", "outputTokens", characters, "audioSeconds", "estimatedCostUsd") '
            "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
            _cuid(),
            session_id,
            provider,
            kind,
            model,
            input_tokens,
            output_tokens,
            characters,
            audio_seconds,
            cost_usd,
        )

    async def daily_minutes_used(self, user_id: str) -> float:
        val = await self.pool.fetchval(
            'SELECT COALESCE(SUM("durationSec"), 0) / 60.0 FROM "Session" WHERE "userId" = $1 AND "createdAt" > now() - interval \'1 day\'',
            user_id,
        )
        return float(val or 0)


async def _init_conn(conn: asyncpg.Connection) -> None:
    await conn.set_type_codec("jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog")
    await conn.set_type_codec("json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog")
