import { z } from "zod";
import { COACHING_MODES, DIFFICULTIES, VOICES } from "@fluent/shared";

/** Runtime zod schema for the shared Scenario JSON Schema (used for seeds and LLM-generated custom scenarios). */
export const personaSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  personality: z.string().min(1),
  accent: z.string().min(1),
});

export const characterSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  personality: z.string().min(1),
  voice: z.enum(VOICES.map((v) => v.key) as [string, ...string[]]),
});

export const scenarioSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    themeId: z.string().min(1),
    title: z.string().min(3),
    description: z.string().min(10),
    difficulty: z.enum(DIFFICULTIES),
    mode: z.enum(["roleplay", "discussion", "interview", "drill", "free_talk"]),
    agentPersona: personaSchema,
    agentOpeningLine: z.string().min(5),
    learnerGoal: z.string().min(1),
    successCriteria: z.array(z.string().min(1)).min(2),
    keyVocabulary: z.array(z.string().min(1)).min(3),
    usefulPhrases: z.array(z.string().min(1)).min(3),
    commonMistakesToWatch: z.array(z.string().min(1)).min(1),
    suggestedDurationMin: z.number().int().min(2).max(30),
    systemPromptTemplate: z.string().min(20),
    characters: z.array(characterSchema).optional(),
    tags: z.array(z.string()).optional(),
  })
  .strict();

export type ScenarioInput = z.infer<typeof scenarioSchema>;

export const sessionCreateSchema = z.object({
  scenarioId: z.string().min(1).nullable().optional(),
  customScenarioId: z.string().min(1).nullable().optional(),
  difficulty: z.enum(DIFFICULTIES),
  coachingMode: z.enum(COACHING_MODES),
  voice: z.enum(VOICES.map((v) => v.key) as [string, ...string[]]),
  speed: z.number().min(0.7).max(1.3).default(1),
  durationMin: z.number().int().min(2).max(60).nullable().default(null),
});
export type SessionCreateInput = z.infer<typeof sessionCreateSchema>;
