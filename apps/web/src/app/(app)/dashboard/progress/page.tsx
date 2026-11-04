import Link from "next/link";
import { requireOwnerPage } from "@/lib/auth-helpers";
import { getProgress, type Range } from "@/lib/queries/dashboard";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { TrendChart } from "@/components/charts";
import { Progress } from "@/components/ui/progress";
import { RangePicker } from "@/components/dashboard/range-picker";
import { CORE_SKILLS, SKILL_LABELS } from "@fluent/shared";
import { Mic } from "lucide-react";

export const metadata = { title: "Progress" };
export const dynamic = "force-dynamic";

const RANGES: Range[] = ["7d", "30d", "90d", "all"];

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const owner = await requireOwnerPage();
  const sp = await searchParams;
  const range: Range = RANGES.includes(sp.range as Range) ? (sp.range as Range) : "30d";
  const data = await getProgress(owner.id, range);
  const skillSeries = CORE_SKILLS.map((k, i) => ({
    key: k,
    name: SKILL_LABELS[k],
    color: [
      "var(--ds-blue-700)",
      "var(--ds-purple-700)",
      "var(--ds-teal-700)",
      "var(--ds-green-700)",
      "var(--ds-amber-700)",
      "var(--ds-pink-700)",
      "var(--ds-gray-700)",
      "var(--ds-red-700)",
    ][i],
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Progress"
        description="How each skill is moving over time."
        actions={<RangePicker value={range} />}
      />
      {data.points.length === 0 ? (
        <EmptyState
          icon={Mic}
          title="No analysed sessions in this range"
          description="Pick a wider range, or practise now to add a data point."
          action={
            <Button asChild>
              <Link href="/practice">Practice</Link>
            </Button>
          }
        />
      ) : (
        <>
          <section className="grid gap-4 lg:grid-cols-2">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Overall score</CardTitle>
                <CardDescription>
                  {data.sessionsInRange} sessions · target band is wherever you are today plus one
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <TrendChart
                  data={data.points}
                  series={[{ key: "overall", name: "Overall" }]}
                  domain={[0, 100]}
                  yTicks={[0, 25, 50, 75, 100]}
                  height={240}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Skills</CardTitle>
                <CardDescription>All eight core skills</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <TrendChart
                  data={data.points}
                  series={skillSeries}
                  domain={[0, 100]}
                  yTicks={[0, 50, 100]}
                  area={false}
                />
                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
                  {skillSeries.map((s) => (
                    <span key={s.key} className="flex items-center gap-1.5 text-xs text-secondary">
                      <span className="size-2 rounded-full" style={{ background: s.color }} />
                      {s.name}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Pace</CardTitle>
                <CardDescription>Words per minute · target band 120–160</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <TrendChart
                  data={data.points}
                  series={[{ key: "wpm", name: "WPM", color: "var(--ds-teal-700)" }]}
                  domain={[60, 200]}
                  unit=" wpm"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Filler words</CardTitle>
                <CardDescription>Per 100 words · lower is better</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <TrendChart
                  data={data.points}
                  series={[{ key: "fillers", name: "Fillers / 100", color: "var(--ds-amber-700)" }]}
                  domain={[0, "auto"]}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Hesitation</CardTitle>
                <CardDescription>Long pauses (&gt;1.5 s) and response latency</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <TrendChart
                  data={data.points}
                  series={[
                    { key: "pauses", name: "Long pauses", color: "var(--ds-purple-700)" },
                    { key: "latency", name: "Response latency (s)", color: "var(--ds-gray-700)" },
                  ]}
                  area={false}
                  domain={[0, "auto"]}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Vocabulary level</CardTitle>
                <CardDescription>Share of words beyond the 2,000 most common</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                {data.vocabTrend.length ? (
                  <TrendChart
                    data={data.vocabTrend}
                    series={[
                      { key: "beyond2k", name: "Beyond top-2k %", color: "var(--ds-pink-700)" },
                    ]}
                    domain={[0, "auto"]}
                    unit="%"
                  />
                ) : (
                  <p className="py-10 text-center text-sm text-secondary">
                    Appears after your next analysed session.
                  </p>
                )}
                {data.vocabTrend.length ? (
                  <p className="mt-2 text-xs text-secondary">
                    Latest estimate:{" "}
                    <Badge variant="blue" size="sm">
                      {data.vocabTrend[data.vocabTrend.length - 1]?.level}
                    </Badge>
                  </p>
                ) : null}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>By theme</CardTitle>
                <CardDescription>
                  Average score per theme — where you&apos;re strongest
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.byTheme.map((t) => (
                  <div key={t.slug}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span>{t.theme}</span>
                      <span className="font-mono text-secondary tabular">
                        {t.avgOverall}{" "}
                        <span className="text-tertiary">
                          · {t.sessions} session{t.sessions === 1 ? "" : "s"}
                        </span>
                      </span>
                    </div>
                    <Progress
                      value={t.avgOverall}
                      size="sm"
                      tone={t.avgOverall >= 75 ? "green" : t.avgOverall >= 60 ? "blue" : "amber"}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
          <section className="grid gap-4 sm:grid-cols-2">
            {[
              { label: "Best session", s: data.best, tone: "green" as const },
              { label: "Toughest session", s: data.worst, tone: "amber" as const },
            ].map(({ label, s, tone }) =>
              s ? (
                <Link
                  key={label}
                  href={`/sessions/${s.id}`}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background-200 p-5 transition-colors hover:bg-background-hover"
                >
                  <div className="min-w-0">
                    <p className="text-xs text-secondary">{label}</p>
                    <p className="mt-1 truncate text-md font-medium">{s.scenarioTitle}</p>
                    <p className="text-xs text-tertiary">
                      {s.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}{" "}
                      · {s.difficulty}
                    </p>
                  </div>
                  <span className="font-mono text-2xl font-medium tabular">
                    <Badge variant={tone} size="lg">
                      {Math.round(s.overall ?? 0)}
                    </Badge>
                  </span>
                </Link>
              ) : null,
            )}
          </section>
        </>
      )}
    </div>
  );
}
