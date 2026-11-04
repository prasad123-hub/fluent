"""Integration: full analysis pipeline against a real Postgres (skipped when DATABASE_URL is unreachable)."""

import asyncio
import json
import os
from pathlib import Path

import pytest

from fluent_agent.analysis.pipeline import analyze_session
from fluent_agent.db import Database
from fluent_agent.settings import Settings

FIX = Path(__file__).parent / "fixtures"
DSN = os.environ.get("DATABASE_URL", "postgresql://fluent:fluent@localhost:5432/fluent")


async def _reachable() -> bool:
    db = Database(DSN)
    try:
        await asyncio.wait_for(db.connect(), timeout=3)
        await db.pool.fetchval("select 1")
        await db.close()
        return True
    except Exception:  # noqa: BLE001
        return False


@pytest.mark.asyncio
async def test_analyze_session_end_to_end():
    if not await _reachable():
        pytest.skip("Postgres not reachable")
    db = Database(DSN)
    await db.connect()
    try:
        user = await db.pool.fetchrow('SELECT id FROM "User" ORDER BY "createdAt" LIMIT 1')
        scenario = await db.pool.fetchrow(
            'SELECT id FROM "Scenario" WHERE id = $1', "interview-hr-screening"
        )
        if not user or not scenario:
            pytest.skip("database not seeded")
        sid = "test_pipeline_" + os.urandom(4).hex()
        await db.pool.execute(
            'INSERT INTO "Session" (id, "userId", "scenarioId", "scenarioTitle", "themeSlug", difficulty, "coachingMode", "agentVoice", status, "livekitRoomName", "durationSec", "updatedAt") '
            "VALUES ($1, $2, $3, $4, $5, 'B1', 'gentle', 'priya', 'analyzing', $6, 120, now())",
            sid,
            user["id"],
            scenario["id"],
            "HR screening",
            "interviews",
            f"room-{sid}",
        )
        for i, row in enumerate(json.loads((FIX / "utterances_interview.json").read_text())):
            await db.insert_utterance(
                sid,
                seq=i + 1,
                speaker=row["speaker"],
                text=row["text"],
                start_ms=row["startMs"],
                end_ms=row["endMs"],
                words=row.get("words"),
                interrupted=row.get("interrupted", False),
            )
        for row in json.loads((FIX / "events_interview.json").read_text()):
            await db.insert_event(sid, type_=row["type"], at_ms=row["atMs"], payload=row["payload"])

        s = Settings.model_validate(
            {
                "DATABASE_URL": DSN,
                "LIVEKIT_URL": "ws://x",
                "LIVEKIT_API_KEY": "k",
                "LIVEKIT_API_SECRET": "s",
                "FLUENT_FAKE_LLM": "1",
            }
        )
        report = await analyze_session(db, sid, s)
        assert report is not None and 0 <= report.overall <= 100

        sess = await db.get_session(sid)
        assert sess is not None and sess["status"] == "complete"
        rep = await db.pool.fetchrow(
            'SELECT overall, cefr, summary FROM "AnalysisReport" WHERE "sessionId" = $1', sid
        )
        assert rep is not None and rep["overall"] == report.overall and rep["summary"]
        n_points = await db.pool.fetchval(
            'SELECT count(*) FROM "MetricPoint" WHERE "sessionId" = $1', sid
        )
        assert n_points >= 10
        n_err = await db.pool.fetchval(
            'SELECT count(*) FROM "GrammarError" WHERE "sessionId" = $1', sid
        )
        assert n_err >= 1
        prof = await db.get_profile(user["id"])
        assert prof is not None and prof["totalSessions"] >= 1

        # idempotent re-run
        report2 = await analyze_session(db, sid, s)
        assert report2 is not None
        assert (
            await db.pool.fetchval(
                'SELECT count(*) FROM "AnalysisReport" WHERE "sessionId" = $1', sid
            )
            == 1
        )
    finally:
        await db.pool.execute('DELETE FROM "Session" WHERE id LIKE $1', "test_pipeline_%")
        await db.close()
