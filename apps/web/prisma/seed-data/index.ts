import type { Scenario } from "@fluent/shared";
import { THEMES } from "./themes";
import { DAILY_LIFE } from "./daily-life";
import { OFFICE } from "./office";
import { INTERVIEWS } from "./interviews";
import { PRESENTATIONS } from "./presentations";
import { DEBATE } from "./debate";
import { NEGOTIATION } from "./negotiation";
import { TRAVEL } from "./travel";
import { EXAMS } from "./exams";
import { SOCIAL } from "./social";
import { STORYTELLING } from "./storytelling";
import { PRONUNCIATION } from "./pronunciation";
import { FLUENCY } from "./fluency";
import { FREE_TALK } from "./free-talk";
import type { SeedScenario } from "./types";

const BY_THEME: Record<string, SeedScenario[]> = {
  "daily-life": DAILY_LIFE,
  office: OFFICE,
  interviews: INTERVIEWS,
  presentations: PRESENTATIONS,
  debate: DEBATE,
  negotiation: NEGOTIATION,
  travel: TRAVEL,
  exams: EXAMS,
  social: SOCIAL,
  storytelling: STORYTELLING,
  pronunciation: PRONUNCIATION,
  fluency: FLUENCY,
  "free-talk": FREE_TALK,
};

export { THEMES };

export const SCENARIOS: Scenario[] = THEMES.flatMap((t) =>
  (BY_THEME[t.id] ?? []).map((s) => ({ ...s, themeId: t.id })),
);
