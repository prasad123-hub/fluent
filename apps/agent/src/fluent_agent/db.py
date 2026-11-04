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


def utcnow() -> datetime:
    """Prisma columns are `timestamp(3)` without time zone: asyncpg needs naive UTC datetimes."""
    return datetime.now(UTC).replace(tzinfo=None)


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

    async def mark_live(self, session_id: str) -> bool:
        """Only a `starting` session becomes live (a superseded/ended one must not be revived)."""
        res = await self.pool.execute(
            'UPDATE "Session" SET status = \'live\', "startedAt" = $2, "updatedAt" = now() '
            "WHERE id = $1 AND status = 'starting'",
            session_id,
            utcnow(),
        )
        return res.endswith("1")

    async def mark_ended(self, session_id: str, *, reason: str, duration_sec: int) -> None:
        await self.set_session_status(
            session_id,
            "analyzing",
            endedAt=utcnow(),
            endReason=reason,
            durationSec=duration_sec,
            analysisStartedAt=utcnow(),
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
            words,
            confidence,
            filler_count,
            interrupted,
            metrics,
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
            payload,
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

    # ── analysis persistence ──────────────────────────────────────────────

    async def previous_reports(
        self, user_id: str, *, exclude_session: str, limit: int = 5
    ) -> list[dict[str, Any]]:
        rows = await self.pool.fetch(
            'SELECT r.overall, r.skills, r.metrics FROM "AnalysisReport" r JOIN "Session" s ON s.id = r."sessionId" '
            'WHERE s."userId" = $1 AND r."sessionId" <> $2 ORDER BY r."createdAt" DESC LIMIT $3',
            user_id,
            exclude_session,
            limit,
        )
        return [dict(r) for r in rows]

    async def upsert_report(self, report: Any) -> None:
        d = report.model_dump()
        metrics = {"deterministic": d["deterministic"], "judged": d["judged"]}
        await self.pool.execute(
            'INSERT INTO "AnalysisReport" (id, "sessionId", overall, cefr, confidence, metrics, errors, rewrites, skills, strengths, priorities, "taskCriteria", drills, vocab, deltas, summary, raw) '
            "VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb, $9::jsonb, $10::jsonb, $11::jsonb, $12::jsonb, $13::jsonb, $14::jsonb, $15::jsonb, $16, $17::jsonb) "
            'ON CONFLICT ("sessionId") DO UPDATE SET overall = EXCLUDED.overall, cefr = EXCLUDED.cefr, confidence = EXCLUDED.confidence, metrics = EXCLUDED.metrics, errors = EXCLUDED.errors, '
            'rewrites = EXCLUDED.rewrites, skills = EXCLUDED.skills, strengths = EXCLUDED.strengths, priorities = EXCLUDED.priorities, "taskCriteria" = EXCLUDED."taskCriteria", drills = EXCLUDED.drills, '
            'vocab = EXCLUDED.vocab, deltas = EXCLUDED.deltas, summary = EXCLUDED.summary, raw = EXCLUDED.raw, "createdAt" = now()',
            _cuid(),
            d["sessionId"],
            d["overall"],
            d["cefr"],
            d["confidenceIndex"],
            metrics,
            d["grammarErrors"],
            d["rewrites"],
            d["skills"],
            d["strengths"],
            d["priorities"],
            d["taskCriteria"],
            d["recommendedDrills"],
            d["vocabBank"],
            d.get("deltas"),
            d["summary"],
            d,
        )

    async def replace_metric_points(
        self, session_id: str, points: dict[str, float], at: Any = None
    ) -> None:
        ts = at or utcnow()
        if getattr(ts, "tzinfo", None) is not None:
            ts = ts.replace(tzinfo=None)
        async with self.pool.acquire() as conn, conn.transaction():
            await conn.execute('DELETE FROM "MetricPoint" WHERE "sessionId" = $1', session_id)
            await conn.executemany(
                'INSERT INTO "MetricPoint" (id, "sessionId", "metricKey", value, at) VALUES ($1, $2, $3, $4, $5)',
                [(_cuid(), session_id, k, float(v), ts) for k, v in points.items()],
            )

    async def replace_grammar_errors(self, session_id: str, errors: list[dict[str, Any]]) -> None:
        async with self.pool.acquire() as conn, conn.transaction():
            await conn.execute('DELETE FROM "GrammarError" WHERE "sessionId" = $1', session_id)
            await conn.executemany(
                'INSERT INTO "GrammarError" (id, "sessionId", category, quote, correction, explanation, severity, "atMs") '
                'VALUES ($1, $2, $3::"GrammarCategory", $4, $5, $6, $7, $8)',
                [
                    (
                        _cuid(),
                        session_id,
                        e["category"],
                        e["quote"][:500],
                        e["correction"][:500],
                        e["explanation"][:500],
                        int(e.get("severity") or 1),
                        e.get("atMs"),
                    )
                    for e in errors
                ],
            )

    async def upsert_vocab(
        self, user_id: str, session_id: str, entries: list[dict[str, Any]]
    ) -> None:
        for e in entries:
            word = str(e["word"]).strip().lower()
            if not word:
                continue
            await self.pool.execute(
                'INSERT INTO "VocabEntry" (id, "userId", word, definition, example, ipa, "partOfSpeech", source) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) '
                'ON CONFLICT ("userId", word) DO UPDATE SET definition = CASE WHEN "VocabEntry".definition = \'\' THEN EXCLUDED.definition ELSE "VocabEntry".definition END',
                _cuid(),
                user_id,
                word,
                str(e.get("definition") or ""),
                str(e.get("example") or ""),
                e.get("ipa"),
                e.get("partOfSpeech"),
                session_id,
            )

    async def upsert_profile(self, user_id: str, p: dict[str, Any]) -> None:
        last = p.get("lastPracticedOn")
        last_dt = datetime.fromisoformat(str(last)) if last else None
        await self.pool.execute(
            'INSERT INTO "UserProfile" ("userId", cefr, "overallScore", "confidenceIndex", "rollingMetrics", "recurringErrors", "fillerTrend", "vocabTrend", "weakPhonemes", strengths, priorities, "streakDays", "lastPracticedOn", "totalMinutesSpoken", "totalSessions", "updatedAt") '
            "VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, $8::jsonb, $9::jsonb, $10::jsonb, $11::jsonb, $12, $13, $14, $15, now()) "
            'ON CONFLICT ("userId") DO UPDATE SET cefr = EXCLUDED.cefr, "overallScore" = EXCLUDED."overallScore", "confidenceIndex" = EXCLUDED."confidenceIndex", "rollingMetrics" = EXCLUDED."rollingMetrics", '
            '"recurringErrors" = EXCLUDED."recurringErrors", "fillerTrend" = EXCLUDED."fillerTrend", "vocabTrend" = EXCLUDED."vocabTrend", "weakPhonemes" = EXCLUDED."weakPhonemes", strengths = EXCLUDED.strengths, '
            'priorities = EXCLUDED.priorities, "streakDays" = EXCLUDED."streakDays", "lastPracticedOn" = EXCLUDED."lastPracticedOn", "totalMinutesSpoken" = EXCLUDED."totalMinutesSpoken", "totalSessions" = EXCLUDED."totalSessions", "updatedAt" = now()',
            user_id,
            p["cefr"],
            float(p["overallScore"]),
            float(p["confidenceIndex"]),
            p["rollingMetrics"],
            p["recurringErrors"],
            p["fillerTrend"],
            p["vocabTrend"],
            p["weakPhonemes"],
            p["strengths"],
            p["priorities"],
            int(p["streakDays"]),
            last_dt,
            float(p["totalMinutesSpoken"]),
            int(p["totalSessions"]),
        )


async def _init_conn(conn: asyncpg.Connection) -> None:
    await conn.set_type_codec("jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog")
    await conn.set_type_codec("json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog")
