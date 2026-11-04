import type { GoalKind } from "@prisma/client";

export const CEFR_LADDER = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export const TARGET_CEFR_OPTIONS = ["A2", "B1", "B2", "C1"] as const;
export type TargetCefr = (typeof TARGET_CEFR_OPTIONS)[number];

export const GOAL_KINDS: GoalKind[] = ["weekly_minutes", "weekly_sessions", "target_cefr"];

/** Monday 00:00 local time of the current week. */
export function startOfWeek(now = new Date()): Date {
  const d = new Date(now);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function cefrIndex(level: string): number {
  const i = CEFR_LADDER.indexOf(level as (typeof CEFR_LADDER)[number]);
  return i < 0 ? 2 : i;
}
