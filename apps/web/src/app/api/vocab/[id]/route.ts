import { route, json } from "@/lib/api";
import { requireOwner } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

export const DELETE = route(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  const owner = await requireOwner();
  const { id } = await params;
  const { count } = await prisma.vocabEntry.deleteMany({ where: { id, userId: owner.id } });
  if (count === 0) return json({ error: "not found" }, { status: 404 });
  return json({ ok: true });
});
