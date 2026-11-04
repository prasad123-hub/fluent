"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Mic, Play, Square, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip } from "@/components/ui/tooltip";
import { phonemeLabel } from "./drills";

export interface WordRow {
  word: string;
  phoneme: string | null;
  lowest: number;
  times: number;
  lastSessionId: string;
  lastSessionTitle: string;
  lastAt: string;
}

const RECORD_MS = 3000;

function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang === "en-IN") ??
    voices.find((v) => v.lang === "en-GB") ??
    voices.find((v) => v.lang.startsWith("en"))
  );
}

function speak(text: string) {
  if (!("speechSynthesis" in window)) {
    toast.error("Your browser can't play reference audio");
    return;
  }
  const u = new SpeechSynthesisUtterance(text);
  const voice = pickVoice();
  if (voice) u.voice = voice;
  u.rate = 0.85;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

function WordTools({ word }: { word: string }) {
  const [state, setState] = useState<"idle" | "recording" | "ready">("idle");
  const [url, setUrl] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(3);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  const record = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      toast.error("Recording isn't supported in this browser");
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast.error("Microphone access was blocked");
      return;
    }
    const rec = new MediaRecorder(stream);
    const chunks: BlobPart[] = [];
    rec.ondataavailable = (e) => chunks.push(e.data);
    rec.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
      setUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(blob);
      });
      setState("ready");
    };
    setState("recording");
    setSecondsLeft(3);
    rec.start();
    const tick = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    setTimeout(() => {
      clearInterval(tick);
      if (rec.state !== "inactive") rec.stop();
    }, RECORD_MS);
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <Tooltip content="Play reference">
        <Button
          variant="ghost"
          size="iconSm"
          aria-label={`Play reference for ${word}`}
          onClick={() => speak(word)}
        >
          <Volume2 />
        </Button>
      </Tooltip>
      {state === "recording" ? (
        <Button variant="secondary" size="sm" disabled prefix={<Square className="text-red-700" />}>
          <span className="font-mono tabular">{secondsLeft}s</span>
        </Button>
      ) : (
        <Tooltip content="Record 3 seconds, then listen to yourself next to the reference">
          <Button variant="secondary" size="sm" prefix={<Mic />} onClick={() => void record()}>
            {state === "ready" ? "Re-record" : "Record & compare"}
          </Button>
        </Tooltip>
      )}
      {state === "ready" && url ? (
        <>
          <audio ref={audioRef} src={url} preload="auto" />
          <Button
            variant="secondary"
            size="sm"
            prefix={<Play />}
            onClick={() => {
              window.speechSynthesis?.cancel();
              void audioRef.current?.play();
            }}
          >
            Listen to yourself
          </Button>
        </>
      ) : null}
    </div>
  );
}

export function PronunciationLab({ rows }: { rows: WordRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mispronounced words</CardTitle>
        <CardDescription>
          Play the reference, record yourself for three seconds, and compare by ear — no scoring,
          just listening.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-secondary">
            No individual words were flagged — your clarity is already strong.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Word</TableHead>
                <TableHead className="hidden sm:table-cell">Sound</TableHead>
                <TableHead className="text-right">Lowest</TableHead>
                <TableHead className="hidden text-right md:table-cell">Flagged</TableHead>
                <TableHead className="hidden lg:table-cell">Last session</TableHead>
                <TableHead className="text-right">Practice</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.word}>
                  <TableCell className="font-medium">{r.word}</TableCell>
                  <TableCell className="hidden font-mono text-xs text-secondary sm:table-cell">
                    {r.phoneme ? phonemeLabel(r.phoneme) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular">
                    <span className={r.lowest < 0.5 ? "text-red-900" : "text-amber-900"}>
                      {Math.round(r.lowest * 100)}%
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-right font-mono text-xs text-secondary tabular md:table-cell">
                    {r.times}×
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Link
                      href={`/sessions/${r.lastSessionId}`}
                      className="inline-flex max-w-44 items-center gap-1 text-xs text-blue-700 hover:underline"
                      title={r.lastSessionTitle}
                    >
                      <span className="truncate">{formatDate(r.lastAt, { year: undefined })}</span>
                      <ArrowUpRight className="size-3.5 shrink-0" />
                    </Link>
                  </TableCell>
                  <TableCell className="py-2">
                    <WordTools word={r.word} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
