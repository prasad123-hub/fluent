import { z } from "zod";
import { route, json } from "@/lib/api";
import { requireOwner } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { COACHING_MODES, DIFFICULTIES, VOICES } from "@fluent/shared";

const patch = z
  .object({
    firstLanguage: z.string().min(1).max(40),
    defaultScenarioId: z.string().nullable(),
    defaultMode: z.enum(COACHING_MODES),
    defaultDifficulty: z.enum(DIFFICULTIES),
    defaultVoice: z.enum(VOICES.map((v) => v.key) as [string, ...string[]]),
    defaultSpeed: z.number().min(0.7).max(1.3),
    defaultDurationMin: z.number().int().min(0).max(60),
    captionsOn: z.boolean(),
    keyPhrasesOn: z.boolean(),
    pushToTalk: z.boolean(),
    noiseSuppression: z.boolean(),
    recordSessions: z.boolean(),
    theme: z.enum(["dark", "light", "system"]),
    preflightDone: z.boolean(),
    micDeviceId: z.string().nullable(),
    name: z.string().min(1).max(60),
  })
  .partial();

export const GET = route(async () => {
  const owner = await requireOwner();
  const settings = await prisma.userSettings.upsert({
    where: { userId: owner.id },
    update: {},
    create: { userId: owner.id },
  });
  return json({ ...settings, name: owner.name, email: owner.email });
});

export const PUT = route(async (req) => {
  const owner = await requireOwner();
  const { name, ...rest } = patch.parse(await req.json());
  if (name) await prisma.user.update({ where: { id: owner.id }, data: { name } });
  const settings = await prisma.userSettings.upsert({
    where: { userId: owner.id },
    update: rest,
    create: { userId: owner.id, ...rest },
  });
  return json(settings);
});
