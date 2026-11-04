import { requireOwnerPage } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { PracticeLauncher, type LauncherScenario } from "@/components/practice/launcher";

export const metadata = { title: "Practice" };
export const dynamic = "force-dynamic";

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{ scenario?: string }>;
}) {
  const owner = await requireOwnerPage();
  const sp = await searchParams;
  const [themes, scenarios, settings, recent, favourites, customs, profile] = await Promise.all([
    prisma.theme.findMany({ orderBy: { order: "asc" } }),
    prisma.scenario.findMany({
      orderBy: [{ theme: { order: "asc" } }, { order: "asc" }],
      include: { theme: { select: { slug: true, title: true } } },
    }),
    prisma.userSettings.findUnique({ where: { userId: owner.id } }),
    prisma.session.findMany({
      where: { userId: owner.id, scenarioId: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { scenarioId: true },
    }),
    prisma.favourite.findMany({ where: { userId: owner.id }, select: { scenarioId: true } }),
    prisma.customScenario.findMany({
      where: { userId: owner.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.userProfile.findUnique({ where: { userId: owner.id } }),
  ]);

  const list: LauncherScenario[] = scenarios.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    difficulty: s.difficulty,
    mode: s.mode,
    themeId: s.themeId,
    themeSlug: s.theme.slug,
    themeTitle: s.theme.title,
    personaName: s.personaName,
    personaRole: s.personaRole,
    suggestedDurationMin: s.suggestedDurationMin,
    tags: (s.tags as string[]) ?? [],
    custom: false,
  }));
  for (const c of customs) {
    const sc = c.scenario as {
      title: string;
      description: string;
      difficulty: string;
      mode: string;
      agentPersona: { name: string; role: string };
      suggestedDurationMin: number;
    };
    list.push({
      id: c.id,
      title: sc.title,
      description: sc.description,
      difficulty: sc.difficulty,
      mode: sc.mode,
      themeId: "custom",
      themeSlug: "custom",
      themeTitle: "My scenarios",
      personaName: sc.agentPersona.name,
      personaRole: sc.agentPersona.role,
      suggestedDurationMin: sc.suggestedDurationMin,
      tags: ["custom"],
      custom: true,
    });
  }

  const recentIds = Array.from(
    new Set(recent.map((r) => r.scenarioId).filter((x): x is string => !!x)),
  ).slice(0, 6);
  const priorities = (profile?.priorities as Array<{ title?: string }> | null) ?? [];
  const recurring = (profile?.recurringErrors as Record<string, number> | null) ?? {};

  // Recommendation: weak areas → drills; else a spread of popular scenarios at the learner's level.
  const level = profile?.cefr ?? settings?.defaultDifficulty ?? "B1";
  const recommendedIds: string[] = [];
  if ((recurring.article ?? 0) + (recurring.tense ?? 0) >= 5)
    recommendedIds.push("fluency-vocabulary-upgrade");
  if (priorities.some((p) => /filler/i.test(p.title ?? "")))
    recommendedIds.push("fluency-filler-elimination");
  if (profile?.totalSessions === 0 || !profile)
    recommendedIds.push("daily-introduce-yourself", "interview-hr-screening");
  for (const s of list) {
    if (recommendedIds.length >= 4) break;
    if (
      !s.custom &&
      s.difficulty === level &&
      s.tags.includes("popular") &&
      !recommendedIds.includes(s.id)
    )
      recommendedIds.push(s.id);
  }
  for (const s of list) {
    if (recommendedIds.length >= 4) break;
    if (!s.custom && s.difficulty === level && !recommendedIds.includes(s.id))
      recommendedIds.push(s.id);
  }

  return (
    <PracticeLauncher
      themes={themes.map((t) => ({ id: t.id, slug: t.slug, title: t.title, icon: t.icon }))}
      scenarios={list}
      recentIds={recentIds}
      recommendedIds={recommendedIds.filter((id) => list.some((s) => s.id === id))}
      favouriteIds={favourites.map((f) => f.scenarioId)}
      initialScenarioId={
        sp.scenario ?? settings?.defaultScenarioId ?? recommendedIds[0] ?? list[0]?.id ?? null
      }
      defaults={{
        difficulty: settings?.defaultDifficulty ?? "B1",
        coachingMode: settings?.defaultMode ?? "gentle",
        voice: settings?.defaultVoice ?? "priya",
        speed: settings?.defaultSpeed ?? 1,
        durationMin: settings?.defaultDurationMin ?? 10,
        captionsOn: settings?.captionsOn ?? true,
        keyPhrasesOn: settings?.keyPhrasesOn ?? true,
        preflightDone: settings?.preflightDone ?? false,
        micDeviceId: settings?.micDeviceId ?? null,
        defaultScenarioId: settings?.defaultScenarioId ?? null,
      }}
    />
  );
}
