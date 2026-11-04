import { route, json } from "@/lib/api";
import { requireOwner } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

/** Marks a failed/stuck session for re-analysis. The agent-side `analysis_worker` picks it up. */
export const POST = route(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  const owner = await requireOwner();
  const { id } = await params;
  const s = await prisma.session.findFirst({ where: { id, userId: owner.id } });
  if (!s) return json({ error: "not found" }, { status: 404 });
  if (s.analysisAttempts >= 5)
    return json({ error: "Too many analysis attempts for this session" }, { status: 409 });
  const utterances = await prisma.utterance.count({ where: { sessionId: id, speaker: "human" } });
  if (utterances === 0)
    return json({ error: "Nothing to analyse: no learner speech was captured" }, { status: 409 });
  const updated = await prisma.session.update({
    where: { id },
    data: {
      status: "analyzing",
      analysisStartedAt: new Date(),
      failureReason: null,
      analysisAttempts: { increment: 1 },
    },
  });
  return json({ id: updated.id, status: updated.status });
});
