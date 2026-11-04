import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { DIFFICULTIES } from "@fluent/shared";
import { route, json } from "@/lib/api";
import { requireOwner } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { generateScenario } from "@/lib/scenario-generator";
import { requestLogger } from "@/lib/logger";

export const maxDuration = 60;

const customScenarioRequestSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(10, "Describe the situation in at least 10 characters")
    .max(500, "Keep the description under 500 characters"),
  difficulty: z.enum(DIFFICULTIES).default("B1"),
});

/** POST /api/scenarios/custom — generate a scenario from a plain-English situation and save it. */
export const POST = route(async (req, _ctx, requestId) => {
  const owner = await requireOwner();
  const input = customScenarioRequestSchema.parse(await req.json());
  const { scenario, source } = await generateScenario({
    prompt: input.prompt,
    difficulty: input.difficulty,
    learnerName: owner.name,
  });
  const saved = await prisma.customScenario.create({
    data: {
      userId: owner.id,
      prompt: input.prompt,
      scenario: scenario as unknown as Prisma.InputJsonValue,
    },
  });
  requestLogger(requestId, { source, customScenarioId: saved.id }).info("custom scenario created");
  return json(
    {
      id: saved.id,
      prompt: saved.prompt,
      scenario,
      source,
      createdAt: saved.createdAt.toISOString(),
    },
    { status: 201 },
  );
});

/** GET /api/scenarios/custom — the owner's custom scenarios, newest first. */
export const GET = route(async () => {
  const owner = await requireOwner();
  const rows = await prisma.customScenario.findMany({
    where: { userId: owner.id },
    orderBy: { createdAt: "desc" },
  });
  return json({
    customScenarios: rows.map((r) => ({
      id: r.id,
      prompt: r.prompt,
      scenario: r.scenario,
      createdAt: r.createdAt.toISOString(),
    })),
  });
});
