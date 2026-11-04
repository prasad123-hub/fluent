export const DIFFICULTIES = ["A2", "B1", "B2", "C1"] as const;
export type DifficultyLevel = (typeof DIFFICULTIES)[number];

export const COACHING_MODES = ["immersive", "gentle", "active", "strict", "drill"] as const;
export type CoachingModeKey = (typeof COACHING_MODES)[number];

export const COACHING_MODE_INFO: Record<CoachingModeKey, { label: string; description: string }> = {
  immersive: {
    label: "Immersive",
    description: "Stays in character. Corrections only in the report.",
  },
  gentle: { label: "Gentle", description: "In character, but naturally rephrases your mistakes." },
  active: {
    label: "Active Coach",
    description: "Pauses at natural points for a one-line correction.",
  },
  strict: { label: "Strict / Exam", description: "Timed, formal, no help. Band score at the end." },
  drill: { label: "Drill", description: "Rapid prompts with instant scoring." },
};

export const SESSION_LENGTHS_MIN = [5, 10, 15, 20] as const;

/** Voice presets. `cartesia`/`elevenlabs`/`openai` ids are resolved by the agent. */
export const VOICES = [
  { key: "priya", label: "Priya", description: "Warm, Indian English", gender: "female" },
  { key: "arjun", label: "Arjun", description: "Calm, Indian English", gender: "male" },
  { key: "katie", label: "Katie", description: "Friendly, American", gender: "female" },
  { key: "oliver", label: "Oliver", description: "Clear, British", gender: "male" },
  { key: "maya", label: "Maya", description: "Energetic, American", gender: "female" },
  { key: "sam", label: "Sam", description: "Measured, neutral", gender: "male" },
] as const;
export type VoiceKey = (typeof VOICES)[number]["key"];

export const CORE_SKILLS = [
  "grammar",
  "vocabulary",
  "fluency",
  "pronunciation",
  "coherence",
  "taskAchievement",
  "communication",
  "confidence",
] as const;
export type CoreSkill = (typeof CORE_SKILLS)[number];

export const SKILL_LABELS: Record<CoreSkill, string> = {
  grammar: "Grammar",
  vocabulary: "Vocabulary",
  fluency: "Fluency",
  pronunciation: "Pronunciation",
  coherence: "Coherence",
  taskAchievement: "Task",
  communication: "Communication",
  confidence: "Confidence",
};

/** Dispatch metadata sent from web → agent when a session starts. */
export interface SessionDispatchMetadata {
  sessionId: string;
  scenarioId: string | null;
  coachingMode: CoachingModeKey;
  difficulty: DifficultyLevel;
  voice: VoiceKey;
  speed: number;
  durationMin: number | null;
  customScenario?: unknown;
}
