import { Prisma } from "@prisma/client";
import { z } from "zod";
import { route, json } from "@/lib/api";
import { requireOwner } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

const body = z.object({
  word: z.string().trim().min(1).max(60),
  definition: z.string().trim().min(1).max(500),
  example: z.string().trim().min(1).max(500),
  ipa: z.string().trim().max(60).optional(),
  partOfSpeech: z.string().trim().max(30).optional(),
});

/** Add a word to the bank by hand. */
export const POST = route(async (req) => {
  const owner = await requireOwner();
  const input = body.parse(await req.json());
  try {
    const entry = await prisma.vocabEntry.create({
      data: {
        userId: owner.id,
        word: input.word.toLowerCase(),
        definition: input.definition,
        example: input.example,
        ipa: input.ipa || null,
        partOfSpeech: input.partOfSpeech || null,
        source: "manual",
      },
    });
    return json(entry, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return json({ error: "That word is already in your bank." }, { status: 409 });
    }
    throw err;
  }
});

export const GET = route(async () => {
  const owner = await requireOwner();
  const entries = await prisma.vocabEntry.findMany({
    where: { userId: owner.id },
    orderBy: [{ nextReviewAt: "asc" }, { createdAt: "desc" }],
  });
  return json(entries);
});
