import { route, json } from "@/lib/api";
import { requireOwner } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

export const POST = route(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  const owner = await requireOwner();
  const { id } = await params;
  const exists = await prisma.scenario.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return json({ error: "not found" }, { status: 404 });
  await prisma.favourite.upsert({
    where: { userId_scenarioId: { userId: owner.id, scenarioId: id } },
    update: {},
    create: { userId: owner.id, scenarioId: id },
  });
  return json({ ok: true });
});

export const DELETE = route(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  const owner = await requireOwner();
  const { id } = await params;
  await prisma.favourite.deleteMany({ where: { userId: owner.id, scenarioId: id } });
  return json({ ok: true });
});
