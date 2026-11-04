"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ConnectionState, Room, RoomEvent, Track, type DisconnectReason } from "livekit-client";
import {
  RoomAudioRenderer,
  RoomContext,
  useLocalParticipant,
  useMultibandTrackVolume,
  useTrackVolume,
  useTranscriptions,
  useVoiceAssistant,
} from "@livekit/components-react";
import {
  Captions,
  CaptionsOff,
  ChevronRight,
  HelpCircle,
  Mic,
  MicOff,
  PanelRightClose,
  PanelRightOpen,
  Pause,
  Play,
  Repeat,
  Snail,
  Square,
  Wifi,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { COACHING_MODE_INFO, type CoachingModeKey } from "@fluent/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { Logo } from "@/components/shell/logo";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Orb, LevelRing, type OrbState } from "./orb";
import { useSessionStatus } from "@/hooks/use-session-status";
import { cn, formatDuration } from "@/lib/utils";

export interface PracticeRoomProps {
  sessionId: string;
  scenario: {
    title: string;
    learnerGoal: string;
    keyVocabulary: string[];
    usefulPhrases: string[];
    personaName: string;
    personaRole: string;
    successCriteria: string[];
  };
  coachingMode: CoachingModeKey;
  difficulty: string;
  durationMin: number | null;
  defaults: {
    captionsOn: boolean;
    keyPhrasesOn: boolean;
    pushToTalk: boolean;
    noiseSuppression: boolean;
  };
}

const FILLERS = [
  "um",
  "uh",
  "like",
  "you know",
  "basically",
  "actually",
  "i mean",
  "kind of",
  "only",
  "itself",
  "na",
  "means",
];

interface JoinInfo {
  token: string;
  url: string;
}

async function fetchJoinInfo(sessionId: string): Promise<JoinInfo> {
  const cached = sessionStorage.getItem(`fluent.session.${sessionId}`);
  if (cached) {
    try {
      const j = JSON.parse(cached) as { token?: string; url?: string };
      if (j.token && j.url) return { token: j.token, url: j.url };
    } catch {
      /* fall through */
    }
  }
  const res = await fetch(`/api/sessions/${sessionId}/token`, { cache: "no-store" });
  if (!res.ok)
    throw new Error(
      (await res.json().catch(() => ({ error: "" }))).error || "This session is no longer live.",
    );
  const j = (await res.json()) as { token: string; livekitUrl: string };
  return { token: j.token, url: j.livekitUrl };
}

export function PracticeRoom(props: PracticeRoomProps) {
  const [room] = useState(
    () =>
      new Room({
        adaptiveStream: false,
        dynacast: false,
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: props.defaults.noiseSuppression,
          autoGainControl: true,
        },
      }),
  );
  const [conn, setConn] = useState<ConnectionState>(ConnectionState.Disconnected);
  const [fatal, setFatal] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    const onState = (s: ConnectionState) => setConn(s);
    const onDisconnected = (reason?: DisconnectReason) => {
      // Room deleted (session ended) or agent gone → go to the report.
      if (active && reason !== undefined) router.replace(`/sessions/${props.sessionId}`);
    };
    room.on(RoomEvent.ConnectionStateChanged, onState);
    room.on(RoomEvent.Disconnected, onDisconnected);
    room.on(RoomEvent.MediaDevicesError, (e: Error) => setMicError(e.message));
    (async () => {
      try {
        const info = await fetchJoinInfo(props.sessionId);
        const micId = sessionStorage.getItem("fluent.micDeviceId");
        await room.connect(info.url, info.token, { autoSubscribe: true });
        if (micId) await room.switchActiveDevice("audioinput", micId).catch(() => {});
        await room.localParticipant.setMicrophoneEnabled(true);
      } catch (e) {
        if (active) setFatal(e instanceof Error ? e.message : "Could not connect");
      }
    })();
    return () => {
      active = false;
      room.off(RoomEvent.ConnectionStateChanged, onState);
      room.off(RoomEvent.Disconnected, onDisconnected);
      void room.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, props.sessionId]);

  if (fatal) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <WifiOff className="size-6 text-red-700" />
        <h1 className="text-xl font-semibold tracking-tight">Couldn&apos;t join the session</h1>
        <p className="max-w-sm text-sm text-secondary">{fatal}</p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => router.push("/practice")}>
            Back to practice
          </Button>
          <Button onClick={() => router.push(`/sessions/${props.sessionId}`)}>View session</Button>
        </div>
      </main>
    );
  }

  return (
    <RoomContext.Provider value={room}>
      <RoomAudioRenderer />
      <Stage {...props} conn={conn} micError={micError} />
    </RoomContext.Provider>
  );
}

function Stage(props: PracticeRoomProps & { conn: ConnectionState; micError: string | null }) {
  const router = useRouter();
  const { state: agentState, audioTrack: agentTrack, agent } = useVoiceAssistant();
  const { localParticipant, microphoneTrack, isMicrophoneEnabled } = useLocalParticipant();
  const transcriptions = useTranscriptions();
  const agentBands = useMultibandTrackVolume(agentTrack, { bands: 16, updateInterval: 40 });
  const micTrackRef = useMemo(
    () =>
      microphoneTrack?.track
        ? {
            participant: localParticipant,
            publication: microphoneTrack,
            source: Track.Source.Microphone,
          }
        : undefined,
    [microphoneTrack, localParticipant],
  );
  const micLevel = useTrackVolume(micTrackRef);

  const [captionsOn, setCaptionsOn] = useState(props.defaults.captionsOn);
  const [panelOpen, setPanelOpen] = useState(props.defaults.keyPhrasesOn);
  const [ptt, setPtt] = useState(props.defaults.pushToTalk);
  const [pttActive, setPttActive] = useState(false);
  const [paused, setPaused] = useState(false);
  const [metricsOn, setMetricsOn] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [ending, setEnding] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [orbSize, setOrbSize] = useState(260);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const apply = () => setOrbSize(mq.matches ? 200 : 260);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  const startRef = useRef<number | null>(null);
  const captionsRef = useRef<HTMLDivElement>(null);

  // Session clock starts when the agent first becomes ready
  useEffect(() => {
    if (
      startRef.current === null &&
      (agentState === "listening" || agentState === "speaking" || agentState === "thinking")
    )
      startRef.current = Date.now();
    const t = setInterval(() => {
      if (startRef.current) setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [agentState]);

  // Server-side status: when it leaves live (timer / inactivity / agent ended), go to the report
  const { data: status } = useSessionStatus(props.sessionId, { intervalMs: 3000 });
  useEffect(() => {
    if (status && status.status !== "starting" && status.status !== "live")
      router.replace(`/sessions/${props.sessionId}`);
  }, [status, router, props.sessionId]);

  // Push-to-talk: mic only while held
  useEffect(() => {
    if (!ptt) {
      void localParticipant.setMicrophoneEnabled(!paused);
      return;
    }
    void localParticipant.setMicrophoneEnabled(pttActive && !paused);
  }, [ptt, pttActive, paused, localParticipant]);

  const sendText = useCallback(
    async (text: string) => {
      try {
        await localParticipant.sendText(text, { topic: "lk.chat" });
      } catch {
        toast.error("Couldn't reach the coach. Check your connection.");
      }
    },
    [localParticipant],
  );

  const help = useCallback(() => void sendText("Help me — what could I say here?"), [sendText]);
  const repeat = useCallback(() => void sendText("Sorry, could you repeat that?"), [sendText]);
  const slower = useCallback(
    () => void sendText("Could you slow down a little, please?"),
    [sendText],
  );

  const endSession = useCallback(async () => {
    setEnding(true);
    try {
      await fetch(`/api/sessions/${props.sessionId}/end`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason: "user_ended" }),
      });
    } finally {
      router.replace(`/sessions/${props.sessionId}`);
    }
  }, [props.sessionId, router]);

  // Keyboard: Space = push-to-talk (when on), H = help, Esc = end confirm, C = captions
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement)?.tagName === "INPUT" ||
        (e.target as HTMLElement)?.tagName === "TEXTAREA"
      )
        return;
      if (e.code === "Space" && ptt) {
        e.preventDefault();
        setPttActive(true);
      }
      if (e.key.toLowerCase() === "h") help();
      if (e.key.toLowerCase() === "c") setCaptionsOn((c) => !c);
      if (e.key === "Escape") setEndOpen(true);
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space" && ptt) setPttActive(false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [ptt, help]);

  // Captions: group by participant, keep order, autoscroll
  const lines = useMemo(
    () =>
      transcriptions
        .map((t) => ({
          id: t.streamInfo.id,
          text: t.text,
          mine:
            t.participantInfo.identity !== agent?.identity &&
            t.participantInfo.identity === localParticipant.identity,
          at: t.streamInfo.timestamp,
        }))
        .filter((l) => l.text.trim()),
    [transcriptions, agent?.identity, localParticipant.identity],
  );
  useEffect(() => {
    captionsRef.current?.scrollTo({ top: captionsRef.current.scrollHeight, behavior: "smooth" });
  }, [lines.length, captionsOn]);

  // Live mini-metrics from captions
  const metrics = useMemo(() => {
    const mine = lines.filter((l) => l.mine).map((l) => l.text.toLowerCase());
    const theirs = lines.filter((l) => !l.mine).map((l) => l.text);
    const myWords = mine.join(" ").split(/\s+/).filter(Boolean);
    const theirWords = theirs.join(" ").split(/\s+/).filter(Boolean);
    let fillers = 0;
    for (const f of FILLERS) fillers += (" " + mine.join(" ") + " ").split(` ${f} `).length - 1;
    const share =
      myWords.length + theirWords.length
        ? Math.round((myWords.length / (myWords.length + theirWords.length)) * 100)
        : 0;
    const minutes = Math.max(1 / 6, elapsed / 60);
    const wpm = Math.round((myWords.length * (share ? 100 / share : 1)) / minutes / 2) || 0;
    return { fillers, share, wpm, myWords: myWords.length };
  }, [lines, elapsed]);

  const orbState: OrbState =
    props.conn !== ConnectionState.Connected ? "connecting" : (agentState as OrbState);
  const stateLabel: Record<string, string> = {
    connecting: "Connecting…",
    "pre-connect-buffering": "Connecting…",
    disconnected: "Waiting for coach…",
    initializing: "Coach is joining…",
    idle: "Ready",
    listening: "Listening",
    thinking: "Thinking",
    speaking: `${props.scenario.personaName} is speaking`,
    failed: "Connection failed",
  };
  const remaining = props.durationMin ? Math.max(0, props.durationMin * 60 - elapsed) : null;
  const reconnecting = props.conn === ConnectionState.Reconnecting;

  return (
    <div className="flex min-h-dvh flex-col bg-background-100">
      {/* minimal top bar */}
      <header className="flex h-12 items-center gap-3 border-b border-border px-4">
        <Logo withWordmark={false} href="/dashboard" />
        <ChevronRight className="size-3.5 text-tertiary" />
        <span className="truncate text-sm font-medium">{props.scenario.title}</span>
        <Badge variant="blue" size="sm" className="hidden sm:inline-flex">
          {COACHING_MODE_INFO[props.coachingMode].label}
        </Badge>
        <Badge variant="gray" size="sm" className="hidden sm:inline-flex">
          {props.difficulty}
        </Badge>
        <div className="ml-auto flex items-center gap-3">
          {reconnecting ? (
            <span className="flex items-center gap-1.5 text-xs text-amber-900">
              <Spinner className="size-3" /> Reconnecting…
            </span>
          ) : (
            <Tooltip content={props.conn}>
              <span
                className="hidden text-tertiary sm:inline-flex"
                aria-label={`Connection: ${props.conn}`}
              >
                {props.conn === ConnectionState.Connected ? (
                  <Wifi className="size-3.5" />
                ) : (
                  <WifiOff className="size-3.5" />
                )}
              </span>
            </Tooltip>
          )}
          <span className="font-mono text-sm text-secondary tabular" aria-live="off">
            {remaining !== null ? formatDuration(remaining) : formatDuration(elapsed)}
          </span>
          <Button
            size="sm"
            variant="secondary"
            prefix={<Square className="size-3" />}
            onClick={() => setEndOpen(true)}
          >
            End
          </Button>
        </div>
      </header>

      {props.micError ? (
        <div className="border-b border-red-500/40 bg-red-100/40 px-4 py-2 text-center text-sm">
          <MicOff className="mr-1 inline size-3.5 text-red-700" /> Microphone problem:{" "}
          {props.micError}. Check browser permissions and reload.
        </div>
      ) : null}

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* centre stage */}
        <main className="relative flex flex-1 flex-col items-center justify-center gap-6 px-4 pt-8 pb-32">
          <div className="relative">
            <Orb state={orbState} bands={agentBands} size={orbSize} />
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-base font-medium">{stateLabel[orbState] ?? orbState}</p>
            <p className="text-xs text-tertiary">
              {props.scenario.personaName} · {props.scenario.personaRole}
            </p>
          </div>
          <LevelRing level={isMicrophoneEnabled ? micLevel : 0}>
            {isMicrophoneEnabled ? (
              <Mic className="size-4 text-secondary" />
            ) : (
              <MicOff className="size-4 text-tertiary" />
            )}
          </LevelRing>

          {captionsOn ? (
            <div
              ref={captionsRef}
              className="w-full max-w-2xl space-y-2 overflow-y-auto rounded-lg border border-border bg-background-200/80 p-4 backdrop-blur"
              style={{ maxHeight: 220 }}
              aria-live="polite"
            >
              {lines.length === 0 ? (
                <p className="text-center text-sm text-tertiary">
                  Captions will appear here as you both speak.
                </p>
              ) : (
                lines.slice(-30).map((l) => (
                  <p
                    key={l.id}
                    className={cn(
                      "text-base leading-6",
                      l.mine ? "text-secondary" : "text-foreground",
                    )}
                  >
                    <span className="mr-2 font-mono text-[11px] tracking-wide text-tertiary uppercase">
                      {l.mine ? "you" : props.scenario.personaName.split(" ")[0]}
                    </span>
                    {l.text}
                  </p>
                ))
              )}
            </div>
          ) : null}

          {metricsOn ? (
            <div className="flex gap-3 font-mono text-xs text-secondary">
              <span className="rounded-full border border-border px-2.5 py-1">
                fillers <b className="text-foreground">{metrics.fillers}</b>
              </span>
              <span className="rounded-full border border-border px-2.5 py-1">
                talk share <b className="text-foreground">{metrics.share}%</b>
              </span>
              <span className="rounded-full border border-border px-2.5 py-1">
                ~<b className="text-foreground">{metrics.wpm}</b> wpm
              </span>
            </div>
          ) : null}
        </main>

        {/* right panel */}
        <aside
          className={cn(
            "border-t border-border bg-background-200 lg:w-80 lg:border-t-0 lg:border-l",
            panelOpen ? "block" : "hidden",
          )}
        >
          <div className="space-y-5 p-5">
            <div>
              <h2 className="text-xs font-medium tracking-wide text-tertiary uppercase">
                Your goal
              </h2>
              <p className="mt-1 text-sm">{props.scenario.learnerGoal}</p>
            </div>
            <div>
              <h2 className="text-xs font-medium tracking-wide text-tertiary uppercase">Try to</h2>
              <ul className="mt-1 space-y-1 text-sm text-secondary">
                {props.scenario.successCriteria.map((c) => (
                  <li key={c} className="flex gap-2">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-gray-600" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-xs font-medium tracking-wide text-tertiary uppercase">
                Key phrases
              </h2>
              <ul className="mt-1 space-y-1.5">
                {props.scenario.usefulPhrases.map((p) => (
                  <li
                    key={p}
                    className="rounded-sm border border-border bg-background-100 px-2.5 py-1.5 text-sm"
                  >
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-xs font-medium tracking-wide text-tertiary uppercase">
                Vocabulary
              </h2>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {props.scenario.keyVocabulary.map((w) => (
                  <Badge key={w} variant="outline">
                    {w}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-3 border-t border-border pt-4 text-sm">
              <div className="flex items-center justify-between">
                <span>
                  Push to talk <Kbd className="ml-1">Space</Kbd>
                </span>
                <Switch size="sm" checked={ptt} onCheckedChange={setPtt} />
              </div>
              <div className="flex items-center justify-between">
                <span>Live metrics</span>
                <Switch size="sm" checked={metricsOn} onCheckedChange={setMetricsOn} />
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* bottom pill bar */}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
        <div className="pointer-events-auto flex max-w-full items-center gap-0.5 rounded-full border border-border bg-background-200/95 p-1 shadow-menu backdrop-blur sm:gap-1 sm:p-1.5">
          <Tooltip content={isMicrophoneEnabled ? "Mute" : "Unmute"}>
            <Button
              size="icon"
              variant={isMicrophoneEnabled ? "tertiary" : "destructive"}
              className="rounded-full"
              aria-label={isMicrophoneEnabled ? "Mute microphone" : "Unmute microphone"}
              onClick={() => {
                if (ptt) setPtt(false);
                setPaused(false);
                void localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
              }}
            >
              {isMicrophoneEnabled ? <Mic /> : <MicOff />}
            </Button>
          </Tooltip>
          {ptt ? (
            <Button
              size="sm"
              variant={pttActive ? "accent" : "secondary"}
              className="rounded-full"
              onMouseDown={() => setPttActive(true)}
              onMouseUp={() => setPttActive(false)}
              onMouseLeave={() => setPttActive(false)}
              onTouchStart={() => setPttActive(true)}
              onTouchEnd={() => setPttActive(false)}
            >
              {pttActive ? "Talking…" : "Hold to talk"}
            </Button>
          ) : null}
          <Tooltip
            content={
              <span>
                Help me <Kbd className="ml-1">H</Kbd>
              </span>
            }
          >
            <Button
              size="sm"
              variant="tertiary"
              className="rounded-full px-2.5 sm:px-3"
              prefix={<HelpCircle />}
              onClick={help}
              aria-label="Help me"
            >
              <span className="hidden sm:inline">Help</span>
            </Button>
          </Tooltip>
          <Tooltip content="Ask the coach to repeat">
            <Button
              size="icon"
              variant="tertiary"
              className="rounded-full"
              aria-label="Repeat that"
              onClick={repeat}
            >
              <Repeat />
            </Button>
          </Tooltip>
          <Tooltip content="Ask the coach to slow down">
            <Button
              size="icon"
              variant="tertiary"
              className="rounded-full"
              aria-label="Slow down"
              onClick={slower}
            >
              <Snail />
            </Button>
          </Tooltip>
          <Tooltip
            content={
              <span>
                Captions <Kbd className="ml-1">C</Kbd>
              </span>
            }
          >
            <Button
              size="icon"
              variant="tertiary"
              className="rounded-full"
              aria-pressed={captionsOn}
              aria-label="Toggle captions"
              onClick={() => setCaptionsOn((c) => !c)}
            >
              {captionsOn ? <Captions /> : <CaptionsOff />}
            </Button>
          </Tooltip>
          <Tooltip content={paused ? "Resume" : "Pause (mutes you)"}>
            <Button
              size="icon"
              variant="tertiary"
              className="rounded-full"
              aria-label={paused ? "Resume" : "Pause"}
              onClick={() => setPaused((p) => !p)}
            >
              {paused ? <Play /> : <Pause />}
            </Button>
          </Tooltip>
          <Tooltip content={panelOpen ? "Hide panel" : "Show goal & phrases"}>
            <Button
              size="icon"
              variant="tertiary"
              className="hidden rounded-full sm:inline-flex"
              aria-label="Toggle side panel"
              onClick={() => setPanelOpen((o) => !o)}
            >
              {panelOpen ? <PanelRightClose /> : <PanelRightOpen />}
            </Button>
          </Tooltip>
          <Tooltip
            content={
              <span>
                End session <Kbd className="ml-1">Esc</Kbd>
              </span>
            }
          >
            <Button
              size="sm"
              variant="primary"
              className="rounded-full"
              onClick={() => setEndOpen(true)}
            >
              End
            </Button>
          </Tooltip>
        </div>
      </div>

      <AlertDialog open={endOpen} onOpenChange={setEndOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>End this session?</AlertDialogTitle>
          <AlertDialogDescription>
            Your report will be ready in about a minute. You can&apos;t resume a session once it
            ends.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep going</AlertDialogCancel>
            <AlertDialogAction onClick={() => void endSession()} disabled={ending}>
              {ending ? "Ending…" : "End session"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
