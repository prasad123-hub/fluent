import { route } from "@/lib/api";
import { requireOwner } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

/** Full JSON export of the owner's data, as a download. */
export const GET = route(async () => {
  const owner = await requireOwner();
  const [profile, settings, goals, vocab, sessions, favourites, customScenarios] =
    await Promise.all([
      prisma.userProfile.findUnique({ where: { userId: owner.id } }),
      prisma.userSettings.findUnique({ where: { userId: owner.id } }),
      prisma.goal.findMany({ where: { userId: owner.id } }),
      prisma.vocabEntry.findMany({ where: { userId: owner.id }, orderBy: { createdAt: "asc" } }),
      prisma.session.findMany({
        where: { userId: owner.id },
        orderBy: { createdAt: "asc" },
        include: {
          report: true,
          grammarErrors: true,
          utterances: { orderBy: { seq: "asc" } },
          events: { orderBy: { atMs: "asc" } },
          metricPoints: true,
          usage: true,
        },
      }),
      prisma.favourite.findMany({ where: { userId: owner.id } }),
      prisma.customScenario.findMany({ where: { userId: owner.id } }),
    ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    app: "fluent",
    version: 1,
    user: { name: owner.name, email: owner.email },
    profile,
    settings,
    goals,
    vocab,
    favourites,
    customScenarios,
    sessions,
  };
  const date = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="fluent-export-${date}.json"`,
      "cache-control": "no-store",
    },
  });
});
