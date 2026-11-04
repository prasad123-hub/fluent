import { route, json } from "@/lib/api";
import { requireOwner } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { scenarioSchema } from "@/lib/schemas";
import type { Prisma } from "@prisma/client";

/**
 * Voice flashcards: builds a custom "vocabulary review" scenario from the learner's due words
 * (the agent says each word, the learner uses it in a sentence, the agent scores it) and returns the
 * custom scenario id for the practice launcher (`/practice?scenario=<id>`).
 */
export const POST = route(async () => {
  const owner = await requireOwner();
  const due = await prisma.vocabEntry.findMany({
    where: { userId: owner.id, status: { not: "mastered" } },
    orderBy: [{ nextReviewAt: "asc" }, { createdAt: "desc" }],
    take: 8,
  });
  if (due.length < 3)
    return json(
      { error: "Add at least three words to your vocabulary bank first." },
      { status: 409 },
    );
  const words = due.map((d) => d.word);
  const wordLines = due
    .map(
      (d) =>
        `- ${d.word}: ${d.definition || "(define briefly)"}${d.example ? ` e.g. "${d.example}"` : ""}`,
    )
    .join("\n");
  const id = `custom-vocab-review-${Date.now().toString(36)}`;
  const scenario = scenarioSchema.parse({
    id,
    themeId: "custom",
    title: `Vocabulary review: ${words.slice(0, 3).join(", ")}${words.length > 3 ? "…" : ""}`,
    description: `Voice flashcards for ${words.length} words from your bank. The coach says a word, you use it in a sentence, the coach scores it and moves on.`,
    difficulty: "B1",
    mode: "drill",
    agentPersona: {
      name: "Anita",
      role: "your vocabulary coach",
      personality: "warm, quick, precise with feedback",
      accent: "Indian English",
    },
    agentOpeningLine: `Hi! Quick vocabulary round: ${words.length} words from your bank. I'll say a word and you use it in a natural sentence. First word: ${words[0]}. What does it mean to you, and can you put it in a sentence?`,
    learnerGoal:
      "Use each word correctly in a natural sentence, with the right form and collocation.",
    successCriteria: [
      "Uses each word in a grammatically correct sentence",
      "Gets the meaning right for at least 80% of words",
      "Recovers after a wrong attempt by trying again",
      "Keeps sentences natural, not dictionary-like",
    ],
    keyVocabulary: words,
    usefulPhrases: [
      "Let me try: …",
      "In a work context I'd say …",
      "Could you give me an example first?",
      "Is that the right usage?",
    ],
    commonMistakesToWatch: [
      "Wrong word form: 'I am very negotiate' (→ I'm good at negotiating)",
      "Wrong collocation: 'make a decision fastly' (→ quickly)",
      "Using the word without a clear meaning",
      "Translating a Hindi phrase word by word",
    ],
    suggestedDurationMin: Math.min(10, 2 + words.length),
    systemPromptTemplate: `You are {{persona.name}}, {{persona.role}}, running a voice flashcard drill with {{learner.name}}. Words and meanings:\n${wordLines}\nFor each word: say it clearly, ask the learner to use it in a sentence, listen, then call score_drill_attempt with a 1–10 score and one line of feedback (meaning correct? form correct? natural?). If the attempt is weak, give a model sentence and let them try once more, then move on. After the last word, summarise which words are solid and which need review. Speak only English. Keep each turn under 45 words unless you are explaining something the learner asked for. Ask one question at a time. Stay natural and warm; never lecture.`,
    tags: ["drill", "vocabulary", "custom"],
  });
  const row = await prisma.customScenario.create({
    data: {
      userId: owner.id,
      prompt: `vocabulary review of ${words.length} words`,
      scenario: scenario as unknown as Prisma.InputJsonValue,
    },
  });
  return json({ customScenarioId: row.id, words }, { status: 201 });
});
