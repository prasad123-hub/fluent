import { route, json } from "@/lib/api";
import { requireOwner } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { emailConfigured } from "@/lib/env";
import { sendGoalReminder } from "@/lib/reminders";
import { startOfWeek } from "@/components/dashboard/goals-data";

/** Sends a test reminder for this week's goals to the owner's email. */
export const POST = route(async () => {
  const owner = await requireOwner();
  if (!emailConfigured) {
    return json(
      {
        error:
          "Email reminders aren't configured. Add RESEND_API_KEY and REMINDER_FROM_EMAIL to your .env and restart.",
      },
      { status: 501 },
    );
  }
  const since = startOfWeek();
  const [goals, profile, week] = await Promise.all([
    prisma.goal.findMany({ where: { userId: owner.id } }),
    prisma.userProfile.findUnique({ where: { userId: owner.id } }),
    prisma.session.aggregate({
      where: { userId: owner.id, status: "complete", createdAt: { gte: since } },
      _sum: { durationSec: true },
      _count: { _all: true },
    }),
  ]);
  const byKind = new Map(goals.map((g) => [g.kind, g]));
  const cefrGoal = byKind.get("target_cefr");
  const result = await sendGoalReminder({
    to: owner.email,
    name: owner.name,
    weekMinutes: (week._sum.durationSec ?? 0) / 60,
    weekSessions: week._count._all,
    targetMinutes: byKind.get("weekly_minutes")?.target ?? null,
    targetSessions: byKind.get("weekly_sessions")?.target ?? null,
    cefr: profile?.cefr ?? "B1",
    targetCefr: cefrGoal?.targetCefr ?? null,
    dueDate: cefrGoal?.dueDate ?? null,
    streakDays: profile?.streakDays ?? 0,
  });
  if (!result.sent) return json({ error: result.reason }, { status: 502 });
  return json({ ok: true, id: result.id, to: owner.email });
});
