import { requireOwnerPage } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { env, emailConfigured, recordingsConfigured } from "@/lib/env";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Health" };
export const dynamic = "force-dynamic";

function pct(values: number[], p: number): number | null {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))] ?? null;
}

const KEYS = [
  ["e2e_latency", "End of speech → first audio"],
  ["transcription_delay", "STT final transcript"],
  ["end_of_turn_delay", "Turn-detector decision"],
  ["llm_node_ttft", "LLM time to first token"],
  ["tts_node_ttfb", "TTS time to first byte"],
] as const;

export default async function HealthPage() {
  const owner = await requireOwnerPage();
  const since = new Date(Date.now() - 7 * 86_400_000);
  const [events, utterances, counts, lastSession, usage] = await Promise.all([
    prisma.sessionEvent.findMany({
      where: { type: "latency", session: { userId: owner.id, createdAt: { gte: since } } },
      select: { payload: true },
      take: 5000,
    }),
    prisma.utterance.findMany({
      where: {
        speaker: "human",
        metrics: { not: { equals: null } },
        session: { userId: owner.id, createdAt: { gte: since } },
      },
      select: { metrics: true },
      take: 5000,
    }),
    Promise.all([
      prisma.session.count({ where: { userId: owner.id } }),
      prisma.session.count({ where: { userId: owner.id, status: "failed" } }),
      prisma.session.count({ where: { userId: owner.id, status: "analyzing" } }),
      prisma.analysisReport.count({ where: { session: { userId: owner.id } } }),
    ]),
    prisma.session.findFirst({
      where: { userId: owner.id, status: { in: ["live", "complete"] } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, status: true },
    }),
    prisma.usageLog.aggregate({
      where: { createdAt: { gte: since } },
      _sum: {
        estimatedCostUsd: true,
        inputTokens: true,
        outputTokens: true,
        characters: true,
        audioSeconds: true,
      },
    }),
  ]);
  const samples: Record<string, number[]> = {};
  for (const e of events) {
    const p = e.payload as Record<string, unknown>;
    for (const [k] of KEYS) if (typeof p[k] === "number") (samples[k] ??= []).push(p[k] as number);
  }
  for (const u of utterances) {
    const m = (u.metrics ?? {}) as Record<string, unknown>;
    for (const [k] of KEYS) if (typeof m[k] === "number") (samples[k] ??= []).push(m[k] as number);
  }
  const e2e = samples["e2e_latency"] ?? [];
  const [total, failed, analyzing, reports] = counts;
  const services = [
    { name: "Database", ok: true, note: "reachable (this page loaded)" },
    { name: "LiveKit", ok: !!env.LIVEKIT_URL, note: env.LIVEKIT_URL },
    {
      name: "LLM provider",
      ok: !!(env.OPENAI_API_KEY || env.ANTHROPIC_API_KEY),
      note:
        env.OPENAI_API_KEY || env.ANTHROPIC_API_KEY
          ? `${env.FLUENT_LLM_PROVIDER} · ${env.FLUENT_LLM_MODEL}`
          : "no key — scripted mode",
    },
    {
      name: "Recordings (Egress → S3)",
      ok: recordingsConfigured,
      note: recordingsConfigured ? env.S3_BUCKET! : "not configured (optional)",
    },
    {
      name: "Email reminders (Resend)",
      ok: emailConfigured,
      note: emailConfigured ? "configured" : "not configured (optional)",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Health"
        description="Per-turn latency (last 7 days), pipeline state and service configuration."
      />
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="p50 end-to-end"
          value={pct(e2e, 50) !== null ? (pct(e2e, 50)! / 1000).toFixed(2) : "—"}
          unit="s"
          hint="target < 1.2 s"
        />
        <StatCard
          label="p95 end-to-end"
          value={pct(e2e, 95) !== null ? (pct(e2e, 95)! / 1000).toFixed(2) : "—"}
          unit="s"
          hint={`${e2e.length} turns measured`}
        />
        <StatCard
          label="Sessions"
          value={total}
          hint={`${reports} reports · ${failed} failed · ${analyzing} analysing`}
        />
        <StatCard
          label="Spend (7d)"
          value={`$${(usage._sum.estimatedCostUsd ?? 0).toFixed(2)}`}
          hint={`${usage._sum.inputTokens ?? 0} in · ${usage._sum.outputTokens ?? 0} out tokens · ${Math.round(usage._sum.audioSeconds ?? 0)} s audio`}
        />
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Latency breakdown</CardTitle>
            <CardDescription>Milliseconds per turn, from the agent&apos;s metrics</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stage</TableHead>
                  <TableHead className="text-right">p50</TableHead>
                  <TableHead className="text-right">p95</TableHead>
                  <TableHead className="text-right">n</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {KEYS.map(([k, label]) => (
                  <TableRow key={k}>
                    <TableCell>
                      {label}
                      <span className="ml-2 font-mono text-xs text-tertiary">{k}</span>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular">
                      {pct(samples[k] ?? [], 50) ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular">
                      {pct(samples[k] ?? [], 95) ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-secondary tabular">
                      {samples[k]?.length ?? 0}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Services</CardTitle>
            <CardDescription>Configuration read from the environment at boot</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {services.map((s) => (
              <div
                key={s.name}
                className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm"
              >
                <span>{s.name}</span>
                <span className="flex items-center gap-2">
                  <span className="max-w-[220px] truncate font-mono text-xs text-tertiary">
                    {s.note}
                  </span>
                  <Badge variant={s.ok ? "green" : "gray"} dot>
                    {s.ok ? "ok" : "off"}
                  </Badge>
                </span>
              </div>
            ))}
            <p className="pt-2 text-xs text-tertiary">
              Caps: max session {env.FLUENT_MAX_SESSION_MINUTES} min · daily{" "}
              {env.FLUENT_MAX_DAILY_MINUTES} min. Last session:{" "}
              {lastSession
                ? `${lastSession.status} · ${lastSession.createdAt.toLocaleString("en-IN")}`
                : "none"}
              .
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
