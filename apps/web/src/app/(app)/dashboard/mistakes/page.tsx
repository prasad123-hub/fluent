import Link from "next/link";
import type { GrammarCategory } from "@prisma/client";
import { AlertCircle, Mic, Target, TrendingDown } from "lucide-react";
import { requireOwnerPage } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { formatDate, round } from "@/lib/utils";
import { PageHeader, SectionTitle } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Bars, CHART, TrendChart, type TrendPoint } from "@/components/charts";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  drillForCategory,
  practiceHref,
} from "@/components/dashboard/drills";
import { MistakesTable, type MistakeRow } from "@/components/dashboard/mistakes-table";

export const metadata = { title: "Mistakes" };
export const dynamic = "force-dynamic";

interface CategoryTrend {
  category: GrammarCategory;
  count: number;
  earlier: number | null;
  recent: number;
  sentence: string;
}

function trendSentence(
  label: string,
  count: number,
  earlier: number | null,
  recent: number,
): string {
  if (earlier === null) {
    return recent > 0
      ? `${label}: first spotted — ${round(recent)} in your latest session`
      : `${label}: ${count} logged so far — a trend appears after your next session`;
  }
  const e = round(earlier);
  const r = round(recent);
  if (r < e) return `${label}: improving (${e} → ${r} per session)`;
  if (r > e) return `${label}: needs attention (${e} → ${r} per session)`;
  return `${label}: steady (${e} per session)`;
}

export default async function MistakesPage() {
  const owner = await requireOwnerPage();
  const [errors, recentSessions] = await Promise.all([
    prisma.grammarError.findMany({
      where: { session: { userId: owner.id } },
      orderBy: { createdAt: "desc" },
      include: {
        session: { select: { id: true, scenarioTitle: true, startedAt: true, createdAt: true } },
      },
    }),
    prisma.session.findMany({
      where: { userId: owner.id, status: "complete" },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        createdAt: true,
        scenarioTitle: true,
        report: { select: { metrics: true } },
        grammarErrors: { select: { category: true } },
      },
    }),
  ]);

  if (errors.length === 0) {
    return (
      <>
        <PageHeader
          title="Mistakes"
          description="Every grammar slip from your sessions, grouped so you can see what is improving."
        />
        <EmptyState
          icon={AlertCircle}
          title="No mistakes logged yet"
          description="Finish a practice session and the analysis will collect anything worth fixing here, with a correction and a one-line explanation."
          action={
            <Button asChild prefix={<Mic />}>
              <Link href="/practice">Start practicing</Link>
            </Button>
          }
        />
      </>
    );
  }

  // ── Counts by category ────────────────────────────────────────────────────
  const counts = new Map<GrammarCategory, number>();
  for (const e of errors) counts.set(e.category, (counts.get(e.category) ?? 0) + 1);
  const ranked = CATEGORY_ORDER.filter((c) => (counts.get(c) ?? 0) > 0).sort(
    (a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0),
  );
  const topCategory = ranked[0] ?? "other";
  const top3 = ranked.slice(0, 3);

  // ── Per-session series (chronological) ───────────────────────────────────
  const sessions = [...recentSessions].reverse();
  const per100: number[] = [];
  for (const s of sessions) {
    const metrics = s.report?.metrics as
      { deterministic?: { vocabulary?: { totalWords?: number } } } | null | undefined;
    const words = metrics?.deterministic?.vocabulary?.totalWords ?? 0;
    if (words > 0) per100.push((s.grammarErrors.length / words) * 100);
  }
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  const recentPer100 = avg(per100.slice(-5));
  const previousPer100 = avg(per100.slice(-10, -5));
  const per100Delta =
    recentPer100 !== null && previousPer100 !== null ? round(recentPer100 - previousPer100) : null;

  const trendData: TrendPoint[] = sessions.map((s) => {
    const point: TrendPoint = { x: formatDate(s.createdAt, { year: undefined }) };
    for (const c of top3) point[c] = s.grammarErrors.filter((g) => g.category === c).length;
    return point;
  });
  const palette = [CHART.accent, CHART.accent2, CHART.accent3];
  const series = top3.map((c, i) => ({ key: c, name: CATEGORY_LABELS[c], color: palette[i] }));

  // ── Per-category trend sentences ─────────────────────────────────────────
  const half = Math.floor(sessions.length / 2);
  const categoryTrends: CategoryTrend[] = ranked.map((c) => {
    const perSession = sessions.map((s) => s.grammarErrors.filter((g) => g.category === c).length);
    const earlier = sessions.length >= 2 ? avg(perSession.slice(0, half)) : null;
    const recent = avg(perSession.slice(half)) ?? perSession[perSession.length - 1] ?? 0;
    return {
      category: c,
      count: counts.get(c) ?? 0,
      earlier,
      recent,
      sentence: trendSentence(CATEGORY_LABELS[c], counts.get(c) ?? 0, earlier, recent),
    };
  });
  const improving = categoryTrends.filter((t) => t.earlier !== null && t.recent < t.earlier).length;

  const rows: MistakeRow[] = errors.map((e) => ({
    id: e.id,
    category: e.category,
    quote: e.quote,
    correction: e.correction,
    explanation: e.explanation,
    severity: e.severity,
    date: (e.session.startedAt ?? e.session.createdAt).toISOString(),
    sessionId: e.session.id,
    sessionTitle: e.session.scenarioTitle,
  }));

  return (
    <>
      <PageHeader
        title="Mistakes"
        description="Every grammar slip from your sessions, grouped so you can see what is improving."
        actions={
          <Button asChild prefix={<Target />}>
            <Link href={practiceHref(drillForCategory(topCategory))}>
              Drill {CATEGORY_LABELS[topCategory].toLowerCase()}
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total errors logged"
          value={errors.length}
          hint={`Across ${new Set(errors.map((e) => e.sessionId)).size} sessions`}
          icon={<AlertCircle />}
        />
        <StatCard
          label="Most common"
          value={CATEGORY_LABELS[topCategory]}
          hint={`${counts.get(topCategory) ?? 0} of ${errors.length} errors — a focused drill fixes this fastest`}
          icon={<Target />}
        />
        <StatCard
          label="Errors per 100 words"
          value={recentPer100 === null ? "—" : round(recentPer100).toFixed(1)}
          delta={per100Delta}
          invertDelta
          hint={
            per100Delta === null
              ? "Average of your last 5 analysed sessions"
              : per100Delta < 0
                ? "Falling versus the 5 sessions before — keep going"
                : per100Delta > 0
                  ? "Slightly up versus the 5 sessions before — normal when you try harder scenarios"
                  : "Holding steady versus the 5 sessions before"
          }
          icon={<TrendingDown />}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>By category</CardTitle>
            <CardDescription>All time, across every session.</CardDescription>
          </CardHeader>
          <CardContent>
            <Bars
              data={ranked.map((c) => ({ x: CATEGORY_LABELS[c], value: counts.get(c) ?? 0 }))}
              name="Errors"
              height={220}
            />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Errors per session</CardTitle>
            <CardDescription>
              Your last {sessions.length} analysed sessions, one line per top category.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sessions.length >= 2 ? (
              <TrendChart data={trendData} series={series} height={220} area={false} />
            ) : (
              <p className="py-10 text-center text-sm text-secondary">
                Complete one more session and the trend lines appear here.
              </p>
            )}
            {series.length > 1 ? (
              <div className="mt-3 flex flex-wrap gap-4">
                {series.map((s) => (
                  <span key={s.key} className="flex items-center gap-2 text-xs text-secondary">
                    <span className="size-2 rounded-full" style={{ background: s.color }} />
                    {s.name}
                  </span>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <section className="mt-8">
        <SectionTitle
          title="Practice this"
          description={
            improving > 0
              ? `${improving} of ${categoryTrends.length} categories are already improving. Pick one to drill.`
              : "Pick a category and the agent will build a short drill around it."
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {categoryTrends.map((t) => {
            const tone =
              t.earlier === null
                ? "text-secondary"
                : t.recent < t.earlier
                  ? "text-green-900"
                  : t.recent > t.earlier
                    ? "text-amber-900"
                    : "text-secondary";
            return (
              <Card key={t.category} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-3">
                    <span>{CATEGORY_LABELS[t.category]}</span>
                    <span className="font-mono text-sm font-normal text-secondary tabular">
                      {t.count}
                    </span>
                  </CardTitle>
                  <CardDescription className={tone}>{t.sentence}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto pt-4">
                  <Button asChild variant="secondary" size="sm" prefix={<Mic />}>
                    <Link href={practiceHref(drillForCategory(t.category))}>Practice this</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle
          title="Error log"
          description="Tap a category to filter. Each row links back to the session it came from."
        />
        <MistakesTable
          rows={rows}
          categories={ranked.map((c) => ({ category: c, count: counts.get(c) ?? 0 }))}
        />
      </section>
    </>
  );
}
