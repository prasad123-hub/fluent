import { route, json } from "@/lib/api";
import { requireOwner } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { sweepStuckAnalyses } from "@/lib/sessions";

/** Status polling endpoint used by the practice page and the report page. */
export const GET = route(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  const owner = await requireOwner();
  const { id } = await params;
  await sweepStuckAnalyses(owner.id);
  const s = await prisma.session.findFirst({
    where: { id, userId: owner.id },
    select: {
      id: true,
      status: true,
      startedAt: true,
      endedAt: true,
      durationSec: true,
      failureReason: true,
      scenarioTitle: true,
      coachingMode: true,
      difficulty: true,
      report: { select: { id: true } },
    },
  });
  if (!s) return json({ error: "not found" }, { status: 404 });
  return json(
    { ...s, hasReport: !!s.report, report: undefined },
    { headers: { "cache-control": "no-store" } },
  );
});
