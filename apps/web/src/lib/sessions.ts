import { randomBytes } from "node:crypto";
import type { CoachingMode, Difficulty, Prisma, SessionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import {
  createRoomAndDispatch,
  deleteRoomQuietly,
  mintLearnerToken,
  startRecording,
  stopRecording,
} from "@/lib/livekit";
import type { SessionCreateInput } from "@/lib/schemas";
import type { Scenario, SessionDispatchMetadata } from "@fluent/shared";

export class SessionError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

function roomNameFor(sessionId: string) {
  return `fluent-${sessionId}-${randomBytes(3).toString("hex")}`;
}

export async function dailyMinutesUsed(userId: string): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const agg = await prisma.session.aggregate({
    _sum: { durationSec: true },
    where: { userId, createdAt: { gte: since } },
  });
  return (agg._sum.durationSec ?? 0) / 60;
}

/** Creates the Session row, the LiveKit room and the agent dispatch; returns what the client needs to connect. */
export async function createPracticeSession(
  userId: string,
  userName: string,
  input: SessionCreateInput,
) {
  // Cost caps
  const used = await dailyMinutesUsed(userId);
  if (used >= env.FLUENT_MAX_DAILY_MINUTES) {
    throw new SessionError(
      `Daily practice cap reached (${env.FLUENT_MAX_DAILY_MINUTES} min). Come back tomorrow.`,
      429,
    );
  }
  const durationMin = input.durationMin
    ? Math.min(input.durationMin, env.FLUENT_MAX_SESSION_MINUTES)
    : null;

  // Abandon any still-live session so the learner never has two agents running
  await prisma.session.updateMany({
    where: { userId, status: { in: ["starting", "live"] } },
    data: { status: "failed", failureReason: "superseded by a new session", endedAt: new Date() },
  });

  let scenarioTitle = "Custom scenario";
  let themeSlug = "custom";
  let customScenario: Scenario | null = null;
  let scenarioId: string | null = null;

  if (input.customScenarioId) {
    const cs = await prisma.customScenario.findFirst({
      where: { id: input.customScenarioId, userId },
    });
    if (!cs) throw new SessionError("Custom scenario not found", 404);
    customScenario = cs.scenario as unknown as Scenario;
    scenarioTitle = customScenario.title;
  } else {
    if (!input.scenarioId) throw new SessionError("scenarioId is required");
    const sc = await prisma.scenario.findUnique({
      where: { id: input.scenarioId },
      include: { theme: true },
    });
    if (!sc) throw new SessionError("Scenario not found", 404);
    scenarioId = sc.id;
    scenarioTitle = sc.title;
    themeSlug = sc.theme.slug;
  }

  const session = await prisma.session.create({
    data: {
      userId,
      scenarioId,
      customScenario: customScenario
        ? (customScenario as unknown as Prisma.InputJsonValue)
        : undefined,
      scenarioTitle,
      themeSlug,
      difficulty: input.difficulty as Difficulty,
      coachingMode: input.coachingMode as CoachingMode,
      agentVoice: input.voice,
      agentSpeed: input.speed,
      durationMin,
      status: "starting",
      livekitRoomName: "pending",
    },
  });
  const roomName = roomNameFor(session.id);

  const metadata: SessionDispatchMetadata = {
    sessionId: session.id,
    scenarioId,
    coachingMode: input.coachingMode,
    difficulty: input.difficulty,
    voice: input.voice as SessionDispatchMetadata["voice"],
    speed: input.speed,
    durationMin,
    customScenario: customScenario ?? undefined,
  };

  try {
    const { dispatchId } = await createRoomAndDispatch(roomName, metadata);
    const token = await mintLearnerToken(roomName, userName);
    await prisma.session.update({
      where: { id: session.id },
      data: { livekitRoomName: roomName, dispatchId },
    });

    // Remember defaults for one-click repeats
    await prisma.userSettings.update({
      where: { userId },
      data: {
        defaultScenarioId: scenarioId ?? undefined,
        defaultMode: input.coachingMode as CoachingMode,
        defaultDifficulty: input.difficulty as Difficulty,
        defaultVoice: input.voice,
        defaultSpeed: input.speed,
        defaultDurationMin: durationMin ?? 0,
      },
    });

    const settings = await prisma.userSettings.findUnique({ where: { userId } });
    if (settings?.recordSessions) {
      try {
        const egressId = await startRecording(roomName, session.id);
        if (egressId)
          await prisma.session.update({ where: { id: session.id }, data: { egressId } });
      } catch (e) {
        logger.warn(
          { err: e, sessionId: session.id },
          "recording could not be started; continuing without it",
        );
      }
    }

    logger.info({ sessionId: session.id, roomName }, "session created and agent dispatched");
    return { sessionId: session.id, livekitUrl: env.LIVEKIT_URL, token, roomName };
  } catch (e) {
    logger.error({ err: e, sessionId: session.id }, "failed to create room / dispatch agent");
    await prisma.session.update({
      where: { id: session.id },
      data: {
        status: "failed",
        failureReason: "Could not reach LiveKit to start the session",
        livekitRoomName: roomName,
      },
    });
    throw new SessionError("Could not start the voice session. Check LiveKit configuration.", 502);
  }
}

/** Learner pressed End (or left). The agent finalises & analyses; this moves status forward and closes the room. */
export async function endPracticeSession(userId: string, sessionId: string, reason = "user_ended") {
  const s = await prisma.session.findFirst({ where: { id: sessionId, userId } });
  if (!s) throw new SessionError("Session not found", 404);
  if (s.status === "complete" || s.status === "failed") return s;

  const endedAt = new Date();
  const durationSec = s.startedAt
    ? Math.max(0, Math.round((endedAt.getTime() - s.startedAt.getTime()) / 1000))
    : (s.durationSec ?? 0);

  let recordingUrl: string | null = s.recordingUrl;
  if (s.egressId && !recordingUrl) recordingUrl = await stopRecording(s.egressId);

  const next: SessionStatus = s.status === "starting" ? "failed" : "analyzing";
  const updated = await prisma.session.update({
    where: { id: s.id },
    data: {
      status: next,
      endedAt: s.endedAt ?? endedAt,
      durationSec: s.durationSec ?? durationSec,
      endReason: s.endReason ?? reason,
      recordingUrl,
      failureReason: next === "failed" ? "Ended before the agent connected" : undefined,
      analysisStartedAt: next === "analyzing" ? (s.analysisStartedAt ?? endedAt) : undefined,
    },
  });
  // Deleting the room makes the agent's session close → it finalises and runs analysis.
  await deleteRoomQuietly(s.livekitRoomName);
  return updated;
}

/** Sessions stuck in `analyzing` for > 5 minutes are marked failed so the UI can offer a retry. */
export async function sweepStuckAnalyses(userId: string) {
  const cutoff = new Date(Date.now() - 5 * 60 * 1000);
  await prisma.session.updateMany({
    where: { userId, status: "analyzing", analysisStartedAt: { lt: cutoff } },
    data: { status: "failed", failureReason: "Analysis timed out. You can retry it." },
  });
}
