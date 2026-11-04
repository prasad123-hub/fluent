import { describe, expect, it } from "vitest";
import { PROMPT_RULES, slugify, templateScenario } from "./scenario-generator";
import { scenarioSchema } from "./schemas";

const PROMPTS: Array<[string, "A2" | "B1" | "B2" | "C1"]> = [
  ["I'm meeting my CEO for the first time at an offsite", "B2"],
  ["Returning a laptop with a cracked screen to the store in Bengaluru", "A2"],
  ["Asking my landlord in Gurgaon to fix the water heater before winter", "B1"],
  ["explaining a production outage to an unhappy client on a call", "C1"],
  ["a debate about remote work", "B1"],
  ["Something with no obvious keywords at all", "A2"],
];

describe("templateScenario", () => {
  it.each(PROMPTS)("builds a schema-valid scenario for %s", (prompt, difficulty) => {
    const draft = templateScenario({ prompt, difficulty });
    const parsed = scenarioSchema.safeParse({
      ...draft,
      id: `custom-${slugify(draft.title)}-abc123`,
      themeId: "custom",
      tags: ["custom"],
    });
    expect(parsed.success, JSON.stringify(parsed.success ? null : parsed.error.issues)).toBe(true);
    expect(draft.difficulty).toBe(difficulty);
    expect(draft.systemPromptTemplate.endsWith(PROMPT_RULES)).toBe(true);
    expect(draft.successCriteria).toHaveLength(4);
    expect(draft.keyVocabulary.length).toBeGreaterThanOrEqual(8);
    expect(draft.usefulPhrases).toHaveLength(5);
    expect(draft.commonMistakesToWatch).toHaveLength(4);
  });

  it("recognises the counterpart from the prompt", () => {
    expect(
      templateScenario({ prompt: "Meeting my CEO at an offsite", difficulty: "B2" }).agentPersona
        .role,
    ).toMatch(/CEO/);
    expect(
      templateScenario({ prompt: "HR interview for a campus placement", difficulty: "B1" }).mode,
    ).toBe("interview");
    expect(
      templateScenario({ prompt: "Group discussion on electric cars", difficulty: "C1" }).mode,
    ).toBe("discussion");
  });

  it("is deterministic for the same prompt", () => {
    const a = templateScenario({ prompt: "Asking my manager for leave", difficulty: "B1" });
    const b = templateScenario({ prompt: "Asking my manager for leave", difficulty: "B1" });
    expect(a).toEqual(b);
  });
});

describe("slugify", () => {
  it("produces id-safe slugs", () => {
    expect(slugify("Meeting my CEO: first time!")).toBe("meeting-my-ceo-first-time");
    expect(slugify("")).toBe("scenario");
    expect(slugify("x".repeat(80)).length).toBeLessThanOrEqual(40);
  });
});
