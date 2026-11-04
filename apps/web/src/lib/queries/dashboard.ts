import type { AnalysisReport } from "@fluent/shared";
import { CORE_SKILLS, SKILL_LABELS, type CoreSkill } from "@fluent/shared";
import { prisma } from "@/lib/db";

export interface SessionSummary {
  id: string;
  scenarioId: string | null;
  scenarioTitle: string;
  themeSlug: string;
  coachingMode: string;
  difficulty: string;
  status: string;
  startedAt: Date | null;
  createdAt: Date;
  durationSec: number | null;
  overall: number | null;
  cefr: string | null;
}

export interface OverviewData {
  profile: {
    cefr: string;
    overallScore: number;
    streakDays: number;
    totalMinutesSpoken: number;
    totalSessions: number;
    priorities: { title: string; example: string; fix: string }[];
    strengths: { title: string; example: string }[];
  } | null;
  latest: {
    overall: number;
    cefr: string;
    delta: number | null;
    skills: Record<CoreSkill, number>;
    skillsPrev: Record<CoreSkill, number> | null;
    recommendedDrills: { scenarioId: string; reason: string; title: string }[];
  } | null;
  sessionsThisWeek: number;
  minutesThisWeek: number;
  trend: { x: string; overall: number }[];
  recent: SessionSummary[];
  recommended: { id: string; title: string; themeTitle: string; difficulty: string } | null;
  weeklyGoalMinutes: number | null;
}

const startOfWeek = () => {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
};

export function skillsFromReport(skills: unknown): Record<CoreSkill, number> {
  const s = (skills ?? {}) as Partial<Record<CoreSkill, number>>;
  return Object.fromEntries(CORE_SKILLS.map((k) => [k, Number(s[k] ?? 0)])) as Record<
    CoreSkill,
    number
  >;
}

export function radarData(skills: Record<CoreSkill, number>) {
  return CORE_SKILLS.map((k) => ({ skill: SKILL_LABELS[k], value: Math.round(skills[k]) }));
}

export async function listSessions(
  userId: string,
  opts: { take?: number; status?: string; themeSlug?: string } = {},
): Promise<SessionSummary[]> {
  const rows = await prisma.session.findMany({
    where: {
      userId,
      ...(opts.status ? { status: opts.status as never } : {}),
      ...(opts.themeSlug ? { themeSlug: opts.themeSlug } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: opts.take ?? 200,
    include: { report: { select: { overall: true, cefr: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    scenarioId: r.scenarioId,
    scenarioTitle: r.scenarioTitle,
    themeSlug: r.themeSlug,
    coachingMode: r.coachingMode,
    difficulty: r.difficulty,
    status: r.status,
    startedAt: r.startedAt,
    createdAt: r.createdAt,
    durationSec: r.durationSec,
    overall: r.report?.overall ?? null,
    cefr: r.report?.cefr ?? null,
  }));
}

export async function getOverview(userId: string): Promise<OverviewData> {
  const weekStart = startOfWeek();
  const [profile, reports, weekAgg, recent, goal, settings] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.analysisReport.findMany({
      where: { session: { userId } },
      orderBy: { session: { createdAt: "desc" } },
      take: 30,
      select: {
        overall: true,
        cefr: true,
        skills: true,
        drills: true,
        deltas: true,
        createdAt: true,
        session: { select: { startedAt: true, createdAt: true } },
      },
    }),
    prisma.session.aggregate({
      where: { userId, status: "complete", createdAt: { gte: weekStart } },
      _count: { _all: true },
      _sum: { durationSec: true },
    }),
    listSessions(userId, { take: 6 }),
    prisma.goal.findFirst({ where: { userId, kind: "weekly_minutes" } }),
    prisma.userSettings.findUnique({ where: { userId } }),
  ]);

  const latestReport = reports[0] ?? null;
  const prevReport = reports[1] ?? null;
  let latest: OverviewData["latest"] = null;
  if (latestReport) {
    const drills = ((latestReport.drills as { scenarioId: string; reason: string }[]) ?? []).slice(
      0,
      3,
    );
    const titles = drills.length
      ? await prisma.scenario.findMany({
          where: { id: { in: drills.map((d) => d.scenarioId) } },
          select: { id: true, title: true },
        })
      : [];
    latest = {
      overall: latestReport.overall,
      cefr: latestReport.cefr,
      delta: ((latestReport.deltas as Record<string, number> | null) ?? {}).overall ?? null,
      skills: skillsFromReport(latestReport.skills),
      skillsPrev: prevReport ? skillsFromReport(prevReport.skills) : null,
      recommendedDrills: drills.map((d) => ({
        ...d,
        title: titles.find((t) => t.id === d.scenarioId)?.title ?? d.scenarioId,
      })),
    };
  }

  const trend = [...reports].reverse().map((r) => ({
    x: (r.session.startedAt ?? r.session.createdAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    }),
    overall: Math.round(r.overall),
  }));

  // Recommended quick-start scenario: top recommended drill if any, else default scenario, else a popular B1 scenario
  let recommended: OverviewData["recommended"] = null;
  const candidateId =
    latest?.recommendedDrills[0]?.scenarioId ?? settings?.defaultScenarioId ?? null;
  const sc = candidateId
    ? await prisma.scenario.findUnique({ where: { id: candidateId }, include: { theme: true } })
    : await prisma.scenario.findFirst({
        where: {
          difficulty:
            profile?.cefr === "C1" || profile?.cefr === "C2"
              ? "C1"
              : ((profile?.cefr as "A2" | "B1" | "B2" | undefined) ?? "B1"),
        },
        orderBy: { order: "asc" },
        include: { theme: true },
      });
  if (sc)
    recommended = {
      id: sc.id,
      title: sc.title,
      themeTitle: sc.theme.title,
      difficulty: sc.difficulty,
    };

  return {
    profile: profile
      ? {
          cefr: profile.cefr,
          overallScore: profile.overallScore,
          streakDays: profile.streakDays,
          totalMinutesSpoken: profile.totalMinutesSpoken,
          totalSessions: profile.totalSessions,
          priorities:
            (profile.priorities as { title: string; example: string; fix: string }[]) ?? [],
          strengths: (profile.strengths as { title: string; example: string }[]) ?? [],
        }
      : null,
    latest,
    sessionsThisWeek: weekAgg._count._all,
    minutesThisWeek: Math.round((weekAgg._sum.durationSec ?? 0) / 60),
    trend,
    recent,
    recommended,
    weeklyGoalMinutes: goal?.target ?? null,
  };
}

export type Range = "7d" | "30d" | "90d" | "all";

export interface ProgressData {
  points: { x: string; [k: string]: number | string }[];
  byTheme: { theme: string; slug: string; sessions: number; avgOverall: number }[];
  best: SessionSummary | null;
  worst: SessionSummary | null;
  vocabTrend: { x: string; beyond2k: number; level: string }[];
  sessionsInRange: number;
}

export async function getProgress(userId: string, range: Range): Promise<ProgressData> {
  const since =
    range === "all"
      ? undefined
      : new Date(Date.now() - { "7d": 7, "30d": 30, "90d": 90 }[range] * 86_400_000);
  const reports = await prisma.analysisReport.findMany({
    where: { session: { userId, ...(since ? { createdAt: { gte: since } } : {}) } },
    orderBy: { session: { createdAt: "asc" } },
    select: {
      overall: true,
      skills: true,
      metrics: true,
      createdAt: true,
      session: {
        select: {
          id: true,
          startedAt: true,
          createdAt: true,
          themeSlug: true,
          scenarioTitle: true,
          coachingMode: true,
          difficulty: true,
          status: true,
          durationSec: true,
          scenarioId: true,
        },
      },
      cefr: true,
    },
  });
  const points = reports.map((r) => {
    const det = ((r.metrics as { deterministic?: AnalysisReport["deterministic"] }) ?? {})
      .deterministic;
    const skills = skillsFromReport(r.skills);
    const date = r.session.startedAt ?? r.session.createdAt;
    return {
      x: date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      dateIso: date.toISOString(),
      overall: Math.round(r.overall),
      ...Object.fromEntries(CORE_SKILLS.map((k) => [k, Math.round(skills[k])])),
      wpm: Math.round(det?.wpm ?? 0),
      fillers: det?.fillers.per100Words ?? 0,
      pauses: det?.pauses.over1500ms ?? 0,
      latency: Math.round((det?.meanResponseLatencyMs ?? 0) / 100) / 10,
      talkShare: Math.round(det?.talkSharePct ?? 0),
    };
  });
  const themes = await prisma.theme.findMany({
    select: { slug: true, title: true, order: true },
    orderBy: { order: "asc" },
  });
  const byTheme = themes
    .map((t) => {
      const rs = reports.filter((r) => r.session.themeSlug === t.slug);
      return {
        theme: t.title,
        slug: t.slug,
        sessions: rs.length,
        avgOverall: rs.length ? Math.round(rs.reduce((a, r) => a + r.overall, 0) / rs.length) : 0,
      };
    })
    .filter((t) => t.sessions > 0)
    .sort((a, b) => b.avgOverall - a.avgOverall);
  const toSummary = (r: (typeof reports)[number]): SessionSummary => ({
    id: r.session.id,
    scenarioId: r.session.scenarioId,
    scenarioTitle: r.session.scenarioTitle,
    themeSlug: r.session.themeSlug,
    coachingMode: r.session.coachingMode,
    difficulty: r.session.difficulty,
    status: r.session.status,
    startedAt: r.session.startedAt,
    createdAt: r.session.createdAt,
    durationSec: r.session.durationSec,
    overall: r.overall,
    cefr: r.cefr,
  });
  const sorted = [...reports].sort((a, b) => b.overall - a.overall);
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: { vocabTrend: true },
  });
  const vocabTrend = (
    (profile?.vocabTrend as { at: string; level: string; beyond2k: number }[]) ?? []
  ).map((p) => ({
    x: new Date(p.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    beyond2k: p.beyond2k,
    level: p.level,
  }));
  return {
    points,
    byTheme,
    best: sorted[0] ? toSummary(sorted[0]) : null,
    worst: sorted.length > 1 ? toSummary(sorted[sorted.length - 1]!) : null,
    vocabTrend,
    sessionsInRange: reports.length,
  };
}
