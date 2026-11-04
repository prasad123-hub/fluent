import { describe, expect, it } from "vitest";
import { SCENARIOS, THEMES } from "./index";
import { scenarioSchema } from "@/lib/schemas";

describe("seed scenarios", () => {
  it("has 13 themes with at least 5 scenarios each (≥65 total)", () => {
    expect(THEMES).toHaveLength(13);
    for (const t of THEMES) {
      const n = SCENARIOS.filter((s) => s.themeId === t.id).length;
      expect(n, `theme ${t.id}`).toBeGreaterThanOrEqual(5);
    }
    expect(SCENARIOS.length).toBeGreaterThanOrEqual(65);
  });

  it("every scenario validates against the shared schema", () => {
    for (const s of SCENARIOS) {
      const r = scenarioSchema.safeParse(s);
      expect(r.success, `${s.id}: ${r.success ? "" : JSON.stringify(r.error.issues[0])}`).toBe(
        true,
      );
    }
  });

  it("ids are unique and templates end with the shared rules", () => {
    const ids = new Set(SCENARIOS.map((s) => s.id));
    expect(ids.size).toBe(SCENARIOS.length);
    for (const s of SCENARIOS) {
      expect(s.systemPromptTemplate, s.id).toContain("Speak only English");
      expect(s.successCriteria.length, s.id).toBeGreaterThanOrEqual(3);
      expect(s.keyVocabulary.length, s.id).toBeGreaterThanOrEqual(5);
      expect(s.usefulPhrases.length, s.id).toBeGreaterThanOrEqual(4);
    }
  });

  it("includes the scenarios other parts of the product link to", () => {
    const ids = new Set(SCENARIOS.map((s) => s.id));
    expect(ids.has("interview-hr-screening")).toBe(true);
    expect(ids.has("fluency-filler-elimination")).toBe(true);
  });

  it("multi-character scenarios declare their characters", () => {
    const multi = SCENARIOS.filter((s) => s.characters && s.characters.length > 1);
    expect(multi.length).toBeGreaterThanOrEqual(2);
  });
});
