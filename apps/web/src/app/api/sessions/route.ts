import { route, json } from "@/lib/api";
import { requireOwner } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { sessionCreateSchema } from "@/lib/schemas";
import { createPracticeSession, sweepStuckAnalyses } from "@/lib/sessions";

export const POST = route(async (req) => {
  const owner = await requireOwner();
  const input = sessionCreateSchema.parse(await req.json());
  const result = await createPracticeSession(owner.id, owner.name, input);
  return json(result, { status: 201 });
});

export const GET = route(async (req) => {
  const owner = await requireOwner();
  await sweepStuckAnalyses(owner.id);
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const take = Math.min(100, Number(url.searchParams.get("limit") ?? 50));
  const sessions = await prisma.session.findMany({
    where: { userId: owner.id, ...(status ? { status: status as never } : {}) },
    orderBy: { createdAt: "desc" },
    take,
    include: { report: { select: { overall: true, cefr: true } } },
  });
  return json({ sessions });
});
