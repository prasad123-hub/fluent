/* Seeds the single owner user, settings/profile rows and ALL themes + scenarios. Idempotent (upserts). */
import { PrismaClient, type Prisma } from "@prisma/client";
import { SCENARIOS, THEMES } from "./seed-data";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.OWNER_EMAIL ?? "owner@example.com";
  const name = process.env.OWNER_NAME ?? "You";

  const user = await prisma.user.upsert({
    where: { email },
    update: { name },
    create: { email, name },
  });
  await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });
  await prisma.userProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  for (const t of THEMES) {
    await prisma.theme.upsert({
      where: { id: t.id },
      update: {
        slug: t.slug,
        title: t.title,
        description: t.description,
        icon: t.icon,
        order: t.order,
      },
      create: t,
    });
  }

  let order = 0;
  for (const s of SCENARIOS) {
    const data: Prisma.ScenarioUncheckedCreateInput = {
      id: s.id,
      themeId: s.themeId,
      title: s.title,
      description: s.description,
      difficulty: s.difficulty,
      mode: s.mode,
      personaName: s.agentPersona.name,
      personaRole: s.agentPersona.role,
      personaPersonality: s.agentPersona.personality,
      personaAccent: s.agentPersona.accent,
      agentOpeningLine: s.agentOpeningLine,
      learnerGoal: s.learnerGoal,
      successCriteria: s.successCriteria,
      keyVocabulary: s.keyVocabulary,
      usefulPhrases: s.usefulPhrases,
      commonMistakesToWatch: s.commonMistakesToWatch,
      suggestedDurationMin: s.suggestedDurationMin,
      systemPromptTemplate: s.systemPromptTemplate,
      characters: s.characters ? (s.characters as unknown as Prisma.InputJsonValue) : undefined,
      tags: s.tags ?? [],
      order: order++,
    };
    const { id: _id, ...update } = data;
    await prisma.scenario.upsert({ where: { id: s.id }, update, create: data });
  }

  console.log(`Seeded owner ${email}, ${THEMES.length} themes, ${SCENARIOS.length} scenarios.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
