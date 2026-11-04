import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { AnalysisReport, Scenario } from "./index";

const fx = (f: string) =>
  JSON.parse(readFileSync(path.join(__dirname, "..", "fixtures", f), "utf8"));

describe("shared fixtures", () => {
  it("scenario fixture matches the generated type", () => {
    const s: Scenario = fx("scenario.example.json");
    expect(s.agentPersona.name).toBe("Meera Iyer");
    expect(s.successCriteria.length).toBeGreaterThanOrEqual(2);
  });
  it("analysis report fixture matches the generated type", () => {
    const r: AnalysisReport = fx("analysis-report.example.json");
    expect(r.skills.grammar).toBe(72);
    expect(r.judged.ielts).toBeNull();
  });
});
