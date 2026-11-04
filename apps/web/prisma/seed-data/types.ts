import type { Scenario } from "@fluent/shared";

export type SeedScenario = Omit<Scenario, "themeId">;

export interface SeedTheme {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string; // lucide icon name
  order: number;
}

/** Placeholders available in systemPromptTemplate (filled by the agent at runtime):
 *  {{persona.name}} {{persona.role}} {{persona.personality}} {{learner.name}} {{difficulty}} {{duration}}
 *  Coaching-mode behaviour, difficulty controls and the learner profile are appended by the agent,
 *  so templates describe only the scene, the character and how to run the conversation. */
export const PROMPT_RULES =
  "Speak only English. Keep each turn under 45 words unless you are explaining something the learner asked for. Ask one question at a time. Stay natural and warm; never lecture.";
