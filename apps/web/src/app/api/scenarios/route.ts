import { route, json } from "@/lib/api";
import { requireOwner } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

/** GET /api/scenarios — themes, seeded scenarios, the owner's custom scenarios and favourites. */
export const GET = route(async () => {
  const owner = await requireOwner();
  const [themes, scenarios, customScenarios, favourites] = await Promise.all([
    prisma.theme.findMany({ orderBy: { order: "asc" } }),
    prisma.scenario.findMany({
      orderBy: [{ theme: { order: "asc" } }, { order: "asc" }],
    }),
    prisma.customScenario.findMany({
      where: { userId: owner.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.favourite.findMany({ where: { userId: owner.id }, select: { scenarioId: true } }),
  ]);
  return json({
    themes,
    scenarios: scenarios.map((s) => ({
      id: s.id,
      themeId: s.themeId,
      title: s.title,
      description: s.description,
      difficulty: s.difficulty,
      mode: s.mode,
      agentPersona: {
        name: s.personaName,
        role: s.personaRole,
        personality: s.personaPersonality,
        accent: s.personaAccent,
      },
      agentOpeningLine: s.agentOpeningLine,
      learnerGoal: s.learnerGoal,
      successCriteria: s.successCriteria,
      keyVocabulary: s.keyVocabulary,
      usefulPhrases: s.usefulPhrases,
      commonMistakesToWatch: s.commonMistakesToWatch,
      suggestedDurationMin: s.suggestedDurationMin,
      characters: s.characters,
      tags: s.tags,
    })),
    customScenarios: customScenarios.map((c) => ({
      id: c.id,
      prompt: c.prompt,
      scenario: c.scenario,
      createdAt: c.createdAt.toISOString(),
    })),
    favouriteIds: favourites.map((f) => f.scenarioId),
  });
});
