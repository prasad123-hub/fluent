import { route, json } from "@/lib/api";
import { requireOwner } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { mintLearnerToken } from "@/lib/livekit";

/** Fresh join token for a session that is still starting/live (page reload, reconnect). */
export const GET = route(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  const owner = await requireOwner();
  const { id } = await params;
  const s = await prisma.session.findFirst({ where: { id, userId: owner.id } });
  if (!s) return json({ error: "not found" }, { status: 404 });
  if (s.status !== "starting" && s.status !== "live")
    return json({ error: "session is not live", status: s.status }, { status: 409 });
  const token = await mintLearnerToken(s.livekitRoomName, owner.name);
  return json({ token, livekitUrl: env.LIVEKIT_URL }, { headers: { "cache-control": "no-store" } });
});
