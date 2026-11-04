import { z } from "zod";
import { route, json } from "@/lib/api";
import { requireOwner } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

const body = z.object({
  id: z.string().min(1),
  /** 0 = Again, 1 = Hard, 2 = Good, 3 = Easy */
  grade: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
});

/** SM-2 quality (0–5) for each of the four buttons. */
const QUALITY = [1, 3, 4, 5] as const;
const MASTERED_AT_DAYS = 21;

function scheduleReview(
  grade: 0 | 1 | 2 | 3,
  prev: { easeFactor: number; intervalDays: number; repetitions: number },
): { easeFactor: number; intervalDays: number; repetitions: number } {
  const q = QUALITY[grade];
  let { easeFactor, intervalDays, repetitions } = prev;
  if (q < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    if (repetitions === 0) intervalDays = 1;
    else if (repetitions === 1) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * easeFactor);
    if (grade === 1) intervalDays = Math.max(1, Math.round(intervalDays * 0.8));
    if (grade === 3 && repetitions >= 1) intervalDays = Math.round(intervalDays * 1.3);
    repetitions += 1;
  }
  easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  return { easeFactor: Math.round(easeFactor * 100) / 100, intervalDays, repetitions };
}

export const POST = route(async (req) => {
  const owner = await requireOwner();
  const { id, grade } = body.parse(await req.json());
  const entry = await prisma.vocabEntry.findFirst({ where: { id, userId: owner.id } });
  if (!entry) return json({ error: "not found" }, { status: 404 });

  const next = scheduleReview(grade, entry);
  const now = new Date();
  const nextReviewAt = new Date(now.getTime() + next.intervalDays * 24 * 60 * 60 * 1000);
  const updated = await prisma.vocabEntry.update({
    where: { id },
    data: {
      ...next,
      nextReviewAt,
      lastReviewedAt: now,
      status: next.intervalDays >= MASTERED_AT_DAYS ? "mastered" : "learning",
    },
  });
  return json(updated);
});
