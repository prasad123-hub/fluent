"""Analysis worker CLI.

    uv run analysis-worker --once      # analyse every session currently in `analyzing` (retry path, demo seed)
    uv run analysis-worker --watch     # poll every 15 s (run next to the agent in production)

The agent worker analyses sessions it hosted itself; this process covers retries requested from the
web app ("Retry analysis"), sessions whose worker crashed, and `pnpm seed:demo`.
"""

from __future__ import annotations

import argparse
import asyncio
from datetime import timedelta

from ..db import Database, utcnow
from ..log import configure_logging, get_logger
from ..settings import settings
from .pipeline import analyze_session

log = get_logger("analysis-worker")


async def run_once(db: Database, *, min_age_sec: int = 0) -> int:
    cutoff = utcnow() - timedelta(seconds=min_age_sec)
    rows = await db.pool.fetch(
        'SELECT id FROM "Session" WHERE status = \'analyzing\' AND ("analysisStartedAt" IS NULL OR "analysisStartedAt" <= $1) '
        'ORDER BY "updatedAt" ASC LIMIT 20',
        cutoff,
    )
    n = 0
    for r in rows:
        log.info("analysis.start", session_id=r["id"])
        await analyze_session(db, r["id"], settings())
        n += 1
    return n


async def main_async(args: argparse.Namespace) -> None:
    s = settings()
    db = Database(s.database_url)
    await db.connect()
    try:
        if args.watch:
            log.info("analysis-worker.watching", interval=args.interval)
            while True:
                try:
                    # give the hosting agent worker 45 s to finish its own analysis before taking over
                    await run_once(db, min_age_sec=45)
                except Exception as e:  # noqa: BLE001
                    log.error("analysis-worker.error", error=str(e))
                await asyncio.sleep(args.interval)
        else:
            n = await run_once(db)
            log.info("analysis-worker.done", analysed=n)
    finally:
        await db.close()


def main() -> None:
    configure_logging()
    p = argparse.ArgumentParser(description="Fluent analysis worker")
    p.add_argument("--once", action="store_true", help="analyse pending sessions and exit")
    p.add_argument("--watch", action="store_true", help="poll continuously")
    p.add_argument("--interval", type=int, default=15)
    args = p.parse_args()
    if not args.once and not args.watch:
        args.once = True
    asyncio.run(main_async(args))


if __name__ == "__main__":
    main()
