import type { DifficultyLevel } from "@fluent/shared";
import { requireOwnerPage } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { scenarioSchema } from "@/lib/schemas";
import { ScenarioLibrary } from "@/components/scenarios/library";
import { CUSTOM_THEME_ID, type LibraryScenario } from "@/components/scenarios/types";

export const metadata = { title: "Scenarios" };
export const dynamic = "force-dynamic";

/** Prisma Json columns hold string[]; keep only the strings so the UI never renders junk. */
function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export default async function ScenariosPage() {
  const owner = await requireOwnerPage();
  const [themes, scenarios, favourites, customs, settings] = await Promise.all([
    prisma.theme.findMany({ orderBy: { order: "asc" } }),
    prisma.scenario.findMany({
      orderBy: [{ theme: { order: "asc" } }, { order: "asc" }],
      include: { theme: { select: { title: true } } },
    }),
    prisma.favourite.findMany({ where: { userId: owner.id }, select: { scenarioId: true } }),
    prisma.customScenario.findMany({
      where: { userId: owner.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.userSettings.findUnique({
      where: { userId: owner.id },
      select: { defaultDifficulty: true },
    }),
  ]);

  const library: LibraryScenario[] = scenarios.map((s) => ({
    id: s.id,
    themeId: s.themeId,
    themeTitle: s.theme.title,
    title: s.title,
    description: s.description,
    difficulty: s.difficulty,
    mode: s.mode,
    persona: {
      name: s.personaName,
      role: s.personaRole,
      personality: s.personaPersonality,
      accent: s.personaAccent,
    },
    agentOpeningLine: s.agentOpeningLine,
    learnerGoal: s.learnerGoal,
    successCriteria: stringList(s.successCriteria),
    keyVocabulary: stringList(s.keyVocabulary),
    usefulPhrases: stringList(s.usefulPhrases),
    commonMistakesToWatch: stringList(s.commonMistakesToWatch),
    suggestedDurationMin: s.suggestedDurationMin,
    tags: stringList(s.tags),
    custom: false,
  }));

  const customLibrary: LibraryScenario[] = [];
  for (const c of customs) {
    const parsed = scenarioSchema.safeParse(c.scenario);
    if (!parsed.success) continue;
    const sc = parsed.data;
    customLibrary.push({
      id: c.id,
      themeId: CUSTOM_THEME_ID,
      themeTitle: "My scenarios",
      title: sc.title,
      description: sc.description,
      difficulty: sc.difficulty,
      mode: sc.mode,
      persona: sc.agentPersona,
      agentOpeningLine: sc.agentOpeningLine,
      learnerGoal: sc.learnerGoal,
      successCriteria: sc.successCriteria,
      keyVocabulary: sc.keyVocabulary,
      usefulPhrases: sc.usefulPhrases,
      commonMistakesToWatch: sc.commonMistakesToWatch,
      suggestedDurationMin: sc.suggestedDurationMin,
      tags: sc.tags ?? ["custom"],
      custom: true,
      prompt: c.prompt,
      createdAt: c.createdAt.toISOString(),
    });
  }

  return (
    <ScenarioLibrary
      themes={themes.map((t) => ({
        id: t.id,
        slug: t.slug,
        title: t.title,
        description: t.description,
        icon: t.icon,
      }))}
      scenarios={library}
      customScenarios={customLibrary}
      favouriteIds={favourites.map((f) => f.scenarioId)}
      defaultDifficulty={(settings?.defaultDifficulty ?? "B1") as DifficultyLevel}
    />
  );
}
