import { notFound, redirect } from "next/navigation";
import { requireOwnerPage } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { PracticeRoom } from "@/components/practice/practice-room";
import type { CoachingModeKey, Scenario } from "@fluent/shared";

export const metadata = { title: "Live practice" };
export const dynamic = "force-dynamic";

export default async function LivePracticePage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const owner = await requireOwnerPage();
  const { sessionId } = await params;
  const s = await prisma.session.findFirst({
    where: { id: sessionId, userId: owner.id },
    include: { scenario: true },
  });
  if (!s) notFound();
  if (s.status !== "starting" && s.status !== "live") redirect(`/sessions/${s.id}`);
  const settings = await prisma.userSettings.findUnique({ where: { userId: owner.id } });

  const custom = s.customScenario as unknown as Scenario | null;
  const scenario = s.scenario
    ? {
        title: s.scenario.title,
        learnerGoal: s.scenario.learnerGoal,
        keyVocabulary: s.scenario.keyVocabulary as string[],
        usefulPhrases: s.scenario.usefulPhrases as string[],
        successCriteria: s.scenario.successCriteria as string[],
        personaName: s.scenario.personaName,
        personaRole: s.scenario.personaRole,
      }
    : custom
      ? {
          title: custom.title,
          learnerGoal: custom.learnerGoal,
          keyVocabulary: custom.keyVocabulary,
          usefulPhrases: custom.usefulPhrases,
          successCriteria: custom.successCriteria,
          personaName: custom.agentPersona.name,
          personaRole: custom.agentPersona.role,
        }
      : {
          title: s.scenarioTitle,
          learnerGoal: "",
          keyVocabulary: [],
          usefulPhrases: [],
          successCriteria: [],
          personaName: "Coach",
          personaRole: "",
        };

  return (
    <PracticeRoom
      sessionId={s.id}
      scenario={scenario}
      coachingMode={s.coachingMode as CoachingModeKey}
      difficulty={s.difficulty}
      durationMin={s.durationMin}
      defaults={{
        captionsOn: settings?.captionsOn ?? true,
        keyPhrasesOn: settings?.keyPhrasesOn ?? true,
        pushToTalk: settings?.pushToTalk ?? false,
        noiseSuppression: settings?.noiseSuppression ?? true,
      }}
    />
  );
}
