import { requireOwnerPage } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { VocabularyBank, type VocabItem } from "@/components/dashboard/vocabulary-bank";

export const metadata = { title: "Vocabulary" };
export const dynamic = "force-dynamic";

export default async function VocabularyPage() {
  const owner = await requireOwnerPage();
  const entries = await prisma.vocabEntry.findMany({
    where: { userId: owner.id },
    orderBy: [{ nextReviewAt: "asc" }, { createdAt: "desc" }],
  });
  const items: VocabItem[] = entries.map((e) => ({
    id: e.id,
    word: e.word,
    definition: e.definition,
    example: e.example,
    ipa: e.ipa,
    partOfSpeech: e.partOfSpeech,
    source: e.source,
    status: e.status,
    easeFactor: e.easeFactor,
    intervalDays: e.intervalDays,
    repetitions: e.repetitions,
    nextReviewAt: e.nextReviewAt.toISOString(),
    lastReviewedAt: e.lastReviewedAt?.toISOString() ?? null,
    createdAt: e.createdAt.toISOString(),
  }));
  return <VocabularyBank initialItems={items} />;
}
