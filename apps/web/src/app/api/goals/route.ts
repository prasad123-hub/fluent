import { z } from "zod";
import { route, json } from "@/lib/api";
import { requireOwner } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

const goalInput = z.object({
  kind: z.enum(["weekly_minutes", "weekly_sessions", "target_cefr"]),
  /** 0 or null removes the goal. For target_cefr the target is ignored (kept at 1). */
  target: z.number().min(0).max(100000).nullable(),
  targetCefr: z.enum(["A2", "B1", "B2", "C1"]).nullable().optional(),
  dueDate: z.string().datetime({ offset: true }).nullable().optional(),
  remindByEmail: z.boolean().optional(),
});

const body = z.object({ goals: z.array(goalInput).min(1) });

export const GET = route(async () => {
  const owner = await requireOwner();
  const goals = await prisma.goal.findMany({ where: { userId: owner.id } });
  return json(goals);
});

/** Upsert goals by kind (unique on userId + kind). */
export const PUT = route(async (req) => {
  const owner = await requireOwner();
  const { goals } = body.parse(await req.json());
  for (const g of goals) {
    const isCefr = g.kind === "target_cefr";
    const remove = isCefr ? !g.targetCefr : !g.target;
    if (remove) {
      await prisma.goal.deleteMany({ where: { userId: owner.id, kind: g.kind } });
      continue;
    }
    const data = {
      target: isCefr ? 1 : Math.round(g.target ?? 0),
      targetCefr: isCefr ? (g.targetCefr ?? null) : null,
      dueDate: isCefr && g.dueDate ? new Date(g.dueDate) : null,
      remindByEmail: g.remindByEmail ?? false,
    };
    await prisma.goal.upsert({
      where: { userId_kind: { userId: owner.id, kind: g.kind } },
      update: data,
      create: { userId: owner.id, kind: g.kind, ...data },
    });
  }
  const saved = await prisma.goal.findMany({ where: { userId: owner.id } });
  return json(saved);
});
