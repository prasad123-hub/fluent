import type { GrammarCategory } from "@prisma/client";

/** Human labels for grammar categories (schema enum order). */
export const CATEGORY_LABELS: Record<GrammarCategory, string> = {
  tense: "Tenses",
  article: "Articles",
  preposition: "Prepositions",
  subject_verb: "Subject–verb",
  word_order: "Word order",
  plural: "Plurals",
  modal: "Modals",
  conditional: "Conditionals",
  other: "Other",
};

export const CATEGORY_ORDER: GrammarCategory[] = [
  "tense",
  "article",
  "preposition",
  "subject_verb",
  "word_order",
  "plural",
  "modal",
  "conditional",
  "other",
];

/** Targeted drill for a grammar category (seeded scenario ids). */
export function drillForCategory(category: GrammarCategory): string {
  switch (category) {
    case "tense":
    case "preposition":
    case "modal":
    case "conditional":
      return "fluency-paraphrase-challenge";
    case "article":
    case "plural":
    case "subject_verb":
    case "word_order":
      return "fluency-vocabulary-upgrade";
    default:
      return "fluency-60-second-talk";
  }
}

export function practiceHref(scenarioId: string): string {
  return `/practice?scenario=${encodeURIComponent(scenarioId)}`;
}

export const PRON_DRILL_IDS = [
  "pron-v-vs-w",
  "pron-th-sounds",
  "pron-ee-vs-i",
  "pron-word-stress",
  "pron-sentence-intonation",
  "pron-linking-reductions",
  "pron-shadowing",
  "pron-tongue-twisters",
  "pron-read-aloud-passage",
] as const;
export type PronDrillId = (typeof PRON_DRILL_IDS)[number];

/** Map a weak phoneme label (e.g. "v/w", "th", "ʒ", "word stress") to the matching drill. */
export function drillForPhoneme(phoneme: string): PronDrillId | null {
  const p = phoneme.toLowerCase().trim();
  if (p.includes("stress")) return "pron-word-stress";
  if (p.includes("th") || p === "θ" || p === "ð") return "pron-th-sounds";
  if (p.includes("ʒ") || p.includes("zh")) return "pron-linking-reductions";
  if ((p.includes("v") && p.includes("w")) || p === "v" || p === "w") return "pron-v-vs-w";
  if (p.includes("ee") || p.includes("iː") || p.includes("ɪ") || /^i(\/|$)/.test(p))
    return "pron-ee-vs-i";
  if (p.includes("intonation")) return "pron-sentence-intonation";
  if (p.includes("link") || p.includes("reduction")) return "pron-linking-reductions";
  return null;
}

/** Friendly label for a phoneme key. */
export function phonemeLabel(phoneme: string): string {
  const p = phoneme.toLowerCase().trim();
  if (p === "v/w" || p === "w/v") return "v / w";
  if (p === "th") return "th (θ / ð)";
  if (p === "ee/i" || p === "i/ee") return "ee / i";
  if (p === "ʒ") return "ʒ (vision, measure)";
  return phoneme;
}
