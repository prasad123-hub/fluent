import { describe, expect, it } from "vitest";
import { scenarioSchema, sessionCreateSchema } from "./schemas";
import { SCENARIOS } from "../../prisma/seed-data";

describe("sessionCreateSchema", () => {
  it("applies defaults and rejects bad values", () => {
    const ok = sessionCreateSchema.parse({
      scenarioId: "x",
      difficulty: "B1",
      coachingMode: "gentle",
      voice: "priya",
    });
    expect(ok.speed).toBe(1);
    expect(ok.durationMin).toBeNull();
    expect(() =>
      sessionCreateSchema.parse({
        scenarioId: "x",
        difficulty: "Z9",
        coachingMode: "gentle",
        voice: "priya",
      }),
    ).toThrow();
    expect(() =>
      sessionCreateSchema.parse({
        scenarioId: "x",
        difficulty: "B1",
        coachingMode: "gentle",
        voice: "priya",
        speed: 3,
      }),
    ).toThrow();
  });
});

describe("scenarioSchema", () => {
  it("accepts every seeded scenario and rejects unknown keys", () => {
    for (const s of SCENARIOS) expect(scenarioSchema.safeParse(s).success).toBe(true);
    expect(scenarioSchema.safeParse({ ...SCENARIOS[0], bogus: 1 }).success).toBe(false);
  });
});
