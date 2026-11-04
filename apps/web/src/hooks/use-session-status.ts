"use client";
import { useEffect, useRef, useState } from "react";

export interface SessionStatusDto {
  id: string;
  status: "starting" | "live" | "ended" | "analyzing" | "complete" | "failed";
  startedAt: string | null;
  endedAt: string | null;
  durationSec: number | null;
  failureReason: string | null;
  scenarioTitle: string;
  coachingMode: string;
  difficulty: string;
  hasReport: boolean;
}

/** Polls GET /api/sessions/:id until `stopWhen` returns true. */
export function useSessionStatus(
  sessionId: string,
  opts: {
    intervalMs?: number;
    stopWhen?: (s: SessionStatusDto) => boolean;
    enabled?: boolean;
  } = {},
) {
  const { intervalMs = 2000, stopWhen, enabled = true } = opts;
  const [data, setData] = useState<SessionStatusDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const stopRef = useRef(stopWhen);
  stopRef.current = stopWhen;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const s = (await res.json()) as SessionStatusDto;
        if (cancelled) return;
        setData(s);
        setError(null);
        if (stopRef.current?.(s)) return;
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "request failed");
      }
      if (!cancelled) timer = setTimeout(tick, intervalMs);
    };
    void tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [sessionId, intervalMs, enabled]);

  return { data, error };
}
