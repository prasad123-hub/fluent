import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { webhookReceiver } from "@/lib/livekit";
import { logger } from "@/lib/logger";

/**
 * LiveKit webhook (configure in LiveKit Cloud → Settings → Webhooks, pointing at /api/livekit/webhook).
 * Safety net: if the room finishes and the session is still live/starting, move it to `analyzing`
 * (or `failed` when nobody ever joined) so nothing stays stuck.
 */
export async function POST(req: Request) {
  const body = await req.text();
  let event;
  try {
    event = await webhookReceiver().receive(body, req.headers.get("authorization") ?? undefined);
  } catch (e) {
    logger.warn({ err: e }, "rejected LiveKit webhook (bad signature)");
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }
  const roomName = event.room?.name;
  logger.info({ event: event.event, roomName }, "livekit webhook");

  if (roomName && (event.event === "room_finished" || event.event === "participant_left")) {
    const s = await prisma.session.findUnique({ where: { livekitRoomName: roomName } });
    if (s && (s.status === "starting" || s.status === "live")) {
      const endedAt = new Date();
      const durationSec = s.startedAt
        ? Math.round((endedAt.getTime() - s.startedAt.getTime()) / 1000)
        : 0;
      await prisma.session.update({
        where: { id: s.id },
        data:
          s.status === "starting"
            ? { status: "failed", failureReason: "Room closed before the session started", endedAt }
            : {
                status: "analyzing",
                endedAt,
                durationSec,
                endReason: s.endReason ?? event.event,
                analysisStartedAt: endedAt,
              },
      });
    }
  }
  if (roomName && event.event === "egress_ended" && event.egressInfo) {
    const file = event.egressInfo.fileResults?.[0];
    const location = file?.location || file?.filename;
    if (location) {
      await prisma.session.updateMany({
        where: { livekitRoomName: roomName },
        data: { recordingUrl: location },
      });
    }
  }
  return NextResponse.json({ ok: true });
}
