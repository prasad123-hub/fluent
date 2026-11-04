import { describe, expect, it } from "vitest";
import { cn, formatDuration, formatMinutes, scoreTone, clamp, round } from "./utils";

describe("utils", () => {
  it("merges tailwind classes", () => {
    expect(cn("p-2", "p-4", false && "x")).toBe("p-4");
  });
  it("formats durations", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(600)).toBe("10:00");
  });
  it("formats minutes", () => {
    expect(formatMinutes(45)).toBe("45m");
    expect(formatMinutes(125)).toBe("2h 5m");
    expect(formatMinutes(120)).toBe("2h");
  });
  it("maps scores to tones", () => {
    expect(scoreTone(90)).toBe("green");
    expect(scoreTone(65)).toBe("blue");
    expect(scoreTone(45)).toBe("amber");
    expect(scoreTone(10)).toBe("red");
  });
  it("clamps and rounds", () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(round(1.256, 2)).toBe(1.26);
  });
});
