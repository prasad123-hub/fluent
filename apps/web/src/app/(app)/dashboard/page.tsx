import Link from "next/link";
import { ArrowRight, Flame, Mic, Sparkles, Target, Timer } from "lucide-react";
import { requireOwnerPage } from "@/lib/auth-helpers";
import { getOverview, radarData } from "@/lib/queries/dashboard";
import { Button } from "@/components/ui/button";
import { Badge, StatusBadge, type StatusKey } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { SkillsRadar, TrendChart } from "@/components/charts";
import { COACHING_MODE_INFO, type CoachingModeKey } from "@fluent/shared";
import { formatDuration, formatMinutes, formatRelative } from "@/lib/utils";

export const metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const owner = await requireOwnerPage();
  const data = await getOverview(owner.id);
  const hasData = !!data.latest;
  const firstName = owner.name.split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8">
      {/* hero */}
      <section className="flex flex-col gap-5 rounded-lg border border-border bg-[radial-gradient(ellipse_at_top_left,rgba(0,112,243,0.14),transparent_55%)] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting}, {firstName}.
          </h1>
          <p className="mt-1 text-base text-secondary">
            {hasData
              ? data.profile?.streakDays && data.profile.streakDays > 1
                ? `You're on a ${data.profile.streakDays}-day streak. Keep it going with a short session.`
                : "Ten minutes today moves the needle. Ready when you are."
              : "Your dashboard fills up after your first session. Let's get you talking."}
          </p>
          {data.recommended ? (
            <p className="mt-3 text-sm text-secondary">
              Quick start:{" "}
              <Link
                href={`/practice?scenario=${data.recommended.id}`}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {data.recommended.title}
              </Link>
              <span className="text-tertiary">
                {" "}
                · {data.recommended.themeTitle} · {data.recommended.difficulty}
              </span>
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-2">
          <Button asChild size="lg" prefix={<Mic />}>
            <Link
              href={data.recommended ? `/practice?scenario=${data.recommended.id}` : "/practice"}
            >
              Practice
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/scenarios">Browse scenarios</Link>
          </Button>
        </div>
      </section>

      {!hasData ? (
        <EmptyState
          icon={Sparkles}
          title="No sessions analysed yet"
          description="Complete your first practice session and your scores, trends and personalised drills will appear here."
          action={
            <Button asChild prefix={<Mic />}>
              <Link href="/practice">Start your first session</Link>
            </Button>
          }
        />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label="Overall score"
              value={Math.round(data.latest!.overall)}
              delta={data.latest!.delta}
              hint="latest session vs previous 5"
            />
            <StatCard
              label="Level"
              value={data.latest!.cefr}
              hint={
                {
                  A1: "Beginner",
                  A2: "Elementary",
                  B1: "Intermediate",
                  B2: "Upper intermediate",
                  C1: "Advanced",
                  C2: "Proficient",
                }[data.latest!.cefr] ?? ""
              }
              icon={<Target />}
            />
            <StatCard
              label="Streak"
              value={data.profile?.streakDays ?? 0}
              unit={data.profile?.streakDays === 1 ? "day" : "days"}
              icon={<Flame />}
              hint="consecutive practice days"
            />
            <StatCard
              label="Minutes practised"
              value={formatMinutes(data.profile?.totalMinutesSpoken ?? 0)}
              icon={<Timer />}
              hint={`${data.profile?.totalSessions ?? 0} sessions in total`}
            />
            <StatCard
              label="This week"
              value={data.sessionsThisWeek}
              unit={data.sessionsThisWeek === 1 ? "session" : "sessions"}
              hint={`${data.minutesThisWeek} min${data.weeklyGoalMinutes ? ` of ${data.weeklyGoalMinutes} min goal` : ""}`}
            >
              {data.weeklyGoalMinutes ? (
                <Progress
                  value={data.minutesThisWeek}
                  max={data.weeklyGoalMinutes}
                  size="sm"
                  tone="blue"
                />
              ) : null}
            </StatCard>
          </section>

          <section className="grid gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Skill profile</CardTitle>
                <CardDescription>
                  Latest session{data.latest!.skillsPrev ? " vs previous" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <SkillsRadar
                  data={radarData(data.latest!.skills)}
                  compare={data.latest!.skillsPrev ? radarData(data.latest!.skillsPrev) : undefined}
                />
              </CardContent>
            </Card>
            <Card className="lg:col-span-3">
              <CardHeader
                action={
                  <Button asChild variant="ghost" size="sm" suffix={<ArrowRight />}>
                    <Link href="/dashboard/progress">Progress</Link>
                  </Button>
                }
              >
                <CardTitle>Overall score</CardTitle>
                <CardDescription>Last {data.trend.length} sessions</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                {data.trend.length > 1 ? (
                  <TrendChart
                    data={data.trend}
                    series={[{ key: "overall", name: "Overall" }]}
                    domain={[0, 100]}
                    yTicks={[0, 25, 50, 75, 100]}
                  />
                ) : (
                  <p className="py-10 text-center text-sm text-secondary">
                    One more session and your trend line appears.
                  </p>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>This week&apos;s focus</CardTitle>
                <CardDescription>From your latest report</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(data.profile?.priorities ?? []).slice(0, 3).map((p) => (
                  <div key={p.title} className="rounded-md border border-border p-3">
                    <p className="text-sm font-medium">{p.title}</p>
                    <p className="mt-1 text-xs text-secondary">
                      <span className="line-through decoration-red-700/60">{p.example}</span> →{" "}
                      <span className="text-green-900">{p.fix}</span>
                    </p>
                  </div>
                ))}
                {!data.profile?.priorities?.length ? (
                  <p className="text-sm text-secondary">Nothing urgent. Keep practising variety.</p>
                ) : null}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Recommended drills</CardTitle>
                <CardDescription>Mapped to your weak spots</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.latest!.recommendedDrills.map((d) => (
                  <Link
                    key={d.scenarioId}
                    href={`/practice?scenario=${d.scenarioId}`}
                    className="flex items-center justify-between gap-3 rounded-md border border-border p-3 transition-colors hover:bg-background-hover"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{d.title}</p>
                      <p className="truncate text-xs text-secondary">{d.reason}</p>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-tertiary" />
                  </Link>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader
                action={
                  <Button asChild variant="ghost" size="sm" suffix={<ArrowRight />}>
                    <Link href="/dashboard/sessions">All</Link>
                  </Button>
                }
              >
                <CardTitle>Recent sessions</CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-border p-0">
                {data.recent.map((s) => (
                  <Link
                    key={s.id}
                    href={`/sessions/${s.id}`}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-background-hover"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{s.scenarioTitle}</p>
                      <p className="text-xs text-tertiary">
                        {formatRelative(s.createdAt)} ·{" "}
                        {COACHING_MODE_INFO[s.coachingMode as CoachingModeKey]?.label ??
                          s.coachingMode}{" "}
                        · {formatDuration(s.durationSec)}
                      </p>
                    </div>
                    {s.overall !== null ? (
                      <span className="font-mono text-sm tabular">{Math.round(s.overall)}</span>
                    ) : (
                      <StatusBadge status={s.status as StatusKey} />
                    )}
                    {s.cefr ? (
                      <Badge variant="outline" size="sm">
                        {s.cefr}
                      </Badge>
                    ) : null}
                  </Link>
                ))}
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
