import { route, json } from "@/lib/api";
import { requireOwner } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * Deletes everything the owner has generated (sessions and their children, vocab, goals,
 * usage, favourites, custom scenarios) and resets profile + settings to defaults.
 * The user row and the seeded scenario library are kept.
 */
export const POST = route(async (_req, _ctx, requestId) => {
  const owner = await requireOwner();
  const where = { userId: owner.id };
  const [sessions, vocab, goals, usage, favourites, customScenarios] = await prisma.$transaction([
    prisma.session.deleteMany({ where }),
    prisma.vocabEntry.deleteMany({ where }),
    prisma.goal.deleteMany({ where }),
    prisma.usageLog.deleteMany({}),
    prisma.favourite.deleteMany({ where }),
    prisma.customScenario.deleteMany({ where }),
    prisma.userProfile.deleteMany({ where }),
    prisma.userSettings.deleteMany({ where }),
  ]);
  logger.info({ requestId, sessions: sessions.count, vocab: vocab.count }, "owner data cleared");
  return json({
    ok: true,
    deleted: {
      sessions: sessions.count,
      vocab: vocab.count,
      goals: goals.count,
      usage: usage.count,
      favourites: favourites.count,
      customScenarios: customScenarios.count,
    },
  });
});
