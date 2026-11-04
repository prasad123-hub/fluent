import type { AnalysisReport } from "@fluent/shared";
import { prisma } from "@/lib/db";

export interface ReportUtterance {
  id: string;
  seq: number;
  speaker: "human" | "agent";
  agentCharacter: string | null;
  text: string;
  startMs: number;
  endMs: number;
  words:
    | {
        w: string;
        start: number | null;
        end: number | null;
        conf: number | null;
        filler?: boolean;
      }[]
    | null;
  confidence: number | null;
  interrupted: boolean;
}

export interface ReportEvent {
  type: string;
  atMs: number;
  payload: Record<string, unknown>;
}

export interface SessionReportData {
  session: {
    id: string;
    scenarioId: string | null;
    scenarioTitle: string;
    themeSlug: string;
    coachingMode: string;
    difficulty: string;
    status: string;
    startedAt: Date | null;
    endedAt: Date | null;
    durationSec: number | null;
    recordingUrl: string | null;
    failureReason: string | null;
    personaName: string;
    successCriteria: string[];
  };
  report: AnalysisReport | null;
  utterances: ReportUtterance[];
  events: ReportEvent[];
}

export async function getSessionReport(
  userId: string,
  sessionId: string,
): Promise<SessionReportData | null> {
  const s = await prisma.session.findFirst({
    where: { id: sessionId, userId },
    include: {
      report: true,
      scenario: { select: { personaName: true, successCriteria: true } },
      utterances: { orderBy: { seq: "asc" } },
      events: { orderBy: { atMs: "asc" } },
    },
  });
  if (!s) return null;
  const custom = s.customScenario as {
    agentPersona?: { name: string };
    successCriteria?: string[];
  } | null;
  const raw = (s.report?.raw ?? null) as AnalysisReport | null;
  return {
    session: {
      id: s.id,
      scenarioId: s.scenarioId,
      scenarioTitle: s.scenarioTitle,
      themeSlug: s.themeSlug,
      coachingMode: s.coachingMode,
      difficulty: s.difficulty,
      status: s.status,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      durationSec: s.durationSec,
      recordingUrl: s.recordingUrl,
      failureReason: s.failureReason,
      personaName: s.scenario?.personaName ?? custom?.agentPersona?.name ?? "Coach",
      successCriteria:
        (s.scenario?.successCriteria as string[] | undefined) ?? custom?.successCriteria ?? [],
    },
    report: raw,
    utterances: s.utterances.map((u) => ({
      id: u.id,
      seq: u.seq,
      speaker: u.speaker,
      agentCharacter: u.agentCharacter,
      text: u.text,
      startMs: u.startMs,
      endMs: u.endMs,
      words: (u.words as ReportUtterance["words"]) ?? null,
      confidence: u.confidence,
      interrupted: u.interrupted,
    })),
    events: s.events.map((e) => ({
      type: e.type,
      atMs: e.atMs,
      payload: (e.payload as Record<string, unknown>) ?? {},
    })),
  };
}
