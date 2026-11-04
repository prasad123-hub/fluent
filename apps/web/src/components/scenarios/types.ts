import type { DifficultyLevel } from "@fluent/shared";

export interface LibraryTheme {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
}

export interface LibraryPersona {
  name: string;
  role: string;
  personality: string;
  accent: string;
}

export interface LibraryScenario {
  id: string;
  themeId: string;
  themeTitle: string;
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  mode: string;
  persona: LibraryPersona;
  agentOpeningLine: string;
  learnerGoal: string;
  successCriteria: string[];
  keyVocabulary: string[];
  usefulPhrases: string[];
  commonMistakesToWatch: string[];
  suggestedDurationMin: number;
  tags: string[];
  custom: boolean;
  /** Only for custom scenarios: the plain-English prompt it was generated from. */
  prompt?: string;
  createdAt?: string;
}

export const DIFFICULTY_TONE: Record<DifficultyLevel, "green" | "blue" | "purple" | "amber"> = {
  A2: "green",
  B1: "blue",
  B2: "purple",
  C1: "amber",
};

export const MODE_LABEL: Record<string, string> = {
  roleplay: "Role-play",
  discussion: "Discussion",
  interview: "Interview",
  drill: "Drill",
  free_talk: "Free talk",
};

export const CUSTOM_THEME_ID = "custom";
