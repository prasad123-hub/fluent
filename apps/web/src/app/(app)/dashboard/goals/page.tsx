import Link from "next/link";
import { Flame, Mic, Target, Timer, TrendingUp } from "lucide-react";
import { requireOwnerPage } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { emailConfigured } from "@/lib/env";
import { formatDate, formatMinutes, round } from "@/lib/utils";
import { PageHeader, SectionTitle } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { GoalsForm, type GoalsFormValues } from "@/components/dashboard/goals-form";
import {
  CEFR_LADDER,
  TARGET_CEFR_OPTIONS,
  cefrIndex,
  startOfWeek,
  type TargetCefr,
} from "@/components/dashboard/goals-data";

export const metadata = { title: "Goals" };
export const dynamic = "force-dynamic";

function toDateInput(d: Date | null | undefined): string {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default async function GoalsPage() {
  const owner = await requireOwnerPage();
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
  const minutesGoal = byKind.get("weekly_minutes");
  const sessionsGoal = byKind.get("weekly_sessions");
  const cefrGoal = byKind.get("target_cefr");

  const weekMinutes = (week._sum.durationSec ?? 0) / 60;
  const weekSessions = week._count._all;
  const cefr = profile?.cefr ?? "B1";
  const streak = profile?.streakDays ?? 0;

  const initial: GoalsFormValues = {
    weeklyMinutes: minutesGoal ? Math.round(minutesGoal.target) : null,
    weeklySessions: sessionsGoal ? Math.round(sessionsGoal.target) : null,
    targetCefr: (TARGET_CEFR_OPTIONS as readonly string[]).includes(cefrGoal?.targetCefr ?? "")
      ? (cefrGoal!.targetCefr as TargetCefr)
      : null,
    dueDate: toDateInput(cefrGoal?.dueDate),
    remindByEmail: goals.some((g) => g.remindByEmail),
  };

  const hasGoals = goals.length > 0;
  const minutesPct = minutesGoal ? Math.min(100, (weekMinutes / minutesGoal.target) * 100) : 0;
  const sessionsPct = sessionsGoal ? Math.min(100, (weekSessions / sessionsGoal.target) * 100) : 0;

  const cefrNow = cefrIndex(cefr);
  const cefrTarget = cefrGoal?.targetCefr ? cefrIndex(cefrGoal.targetCefr) : null;
  const cefrPct =
    cefrTarget === null
      ? 0
      : cefrTarget <= cefrNow
        ? 100
        : Math.round((cefrNow / cefrTarget) * 100);
  const daysLeft = cefrGoal?.dueDate
    ? Math.ceil((cefrGoal.dueDate.getTime() - Date.now()) / 86_400_000)
    : null;

  return (
    <>
      <PageHeader
        title="Goals"
        description="Small weekly targets you can actually keep. Progress resets every Monday."
        actions={
          <Badge variant={streak > 0 ? "amber" : "gray"} size="lg" className="gap-1.5">
            <Flame className="size-3.5" />
            <span className="font-mono tabular">{streak}</span>-day streak
          </Badge>
        }
      />

      {hasGoals ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Timer className="size-4 text-secondary" /> Minutes this week
              </CardTitle>
              <CardDescription>
                {minutesGoal
                  ? minutesPct >= 100
                    ? "Target reached — anything more is a bonus."
                    : `${formatMinutes(Math.max(0, minutesGoal.target - weekMinutes))} to go.`
                  : "No minutes target set yet."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-mono text-2xl font-medium tracking-tight tabular">
                {round(weekMinutes, 0)}
                {minutesGoal ? (
                  <span className="text-base text-secondary"> / {minutesGoal.target} min</span>
                ) : (
                  <span className="text-base text-secondary"> min</span>
                )}
              </p>
              <Progress value={minutesPct} tone={minutesPct >= 100 ? "green" : "blue"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mic className="size-4 text-secondary" /> Sessions this week
              </CardTitle>
              <CardDescription>
                {sessionsGoal
                  ? sessionsPct >= 100
                    ? "Done for the week — great consistency."
                    : `${Math.max(0, sessionsGoal.target - weekSessions)} more to hit the target.`
                  : "No sessions target set yet."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-mono text-2xl font-medium tracking-tight tabular">
                {weekSessions}
                {sessionsGoal ? (
                  <span className="text-base text-secondary"> / {sessionsGoal.target}</span>
                ) : null}
              </p>
              <Progress value={sessionsPct} tone={sessionsPct >= 100 ? "green" : "blue"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="size-4 text-secondary" /> Level
              </CardTitle>
              <CardDescription>
                {cefrGoal?.targetCefr
                  ? cefrPct >= 100
                    ? `You're already at ${cefrGoal.targetCefr}. Time to aim higher.`
                    : daysLeft !== null
                      ? daysLeft >= 0
                        ? `${daysLeft} days to reach ${cefrGoal.targetCefr} by ${formatDate(cefrGoal.dueDate!)}.`
                        : `Target date passed — keep going, ${cefrGoal.targetCefr} is close.`
                      : `Working towards ${cefrGoal.targetCefr}.`
                  : "No target level set yet."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-mono text-2xl font-medium tracking-tight tabular">
                {cefr}
                {cefrGoal?.targetCefr ? (
                  <span className="text-base text-secondary"> → {cefrGoal.targetCefr}</span>
                ) : null}
              </p>
              <Progress value={cefrPct} tone={cefrPct >= 100 ? "green" : "blue"} />
              <div className="flex justify-between font-mono text-[10px] text-tertiary tabular">
                {CEFR_LADDER.map((l) => (
                  <span key={l} className={l === cefr ? "text-foreground" : undefined}>
                    {l}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <EmptyState
          icon={Target}
          title="Set your first goal"
          description="A weekly minutes target is the simplest way to build the habit. Ten minutes a day adds up to over an hour of real speaking."
          compact
          action={
            <Button asChild variant="secondary" prefix={<Mic />}>
              <Link href="/practice">Or start with a session</Link>
            </Button>
          }
        />
      )}

      <section className="mt-8">
        <SectionTitle title="Targets" description="Leave a field empty to clear that goal." />
        <GoalsForm initial={initial} emailConfigured={emailConfigured} ownerEmail={owner.email} />
      </section>
    </>
  );
}
