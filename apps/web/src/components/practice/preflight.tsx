"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Headphones, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Step = "permission" | "listening" | "heard" | "denied";

/** Mic permission → device picker → live level meter → "say: I'm ready" sanity check (3 s). */
export function Preflight({ onDone }: { onDone: (deviceId: string | null) => void }) {
  const [step, setStep] = useState<Step>("permission");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string>("");
  const [level, setLevel] = useState(0);
  const [heardMs, setHeardMs] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => () => stop(), []);

  function stop() {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void ctxRef.current?.close();
    ctxRef.current = null;
  }

  async function begin(id?: string) {
    stop();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: id ? { deviceId: { exact: id } } : true,
      });
      streamRef.current = stream;
      const list = (await navigator.mediaDevices.enumerateDevices()).filter(
        (d) => d.kind === "audioinput",
      );
      setDevices(list);
      const active = stream.getAudioTracks()[0]?.getSettings().deviceId ?? "";
      setDeviceId(active);
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      let heard = 0;
      let last = performance.now();
      setStep("listening");
      const loop = () => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = ((buf[i] ?? 128) - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        const now = performance.now();
        setLevel(Math.min(1, rms * 6));
        if (rms > 0.035) heard += now - last;
        last = now;
        setHeardMs(heard);
        if (heard > 900) {
          setStep("heard");
          return;
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch {
      setStep("denied");
    }
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-start gap-3 rounded-md border border-border bg-background-300/60 p-3 text-sm">
        <Headphones className="mt-0.5 size-4 shrink-0 text-secondary" />
        <p className="text-secondary">
          Use headphones if you can, so the coach doesn&apos;t hear itself through your speakers.
        </p>
      </div>

      {step === "permission" ? (
        <Button className="w-full" prefix={<Mic />} onClick={() => void begin()}>
          Allow microphone
        </Button>
      ) : null}

      {step === "denied" ? (
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-md border border-red-500/40 bg-red-100/50 p-3 text-sm">
            <MicOff className="mt-0.5 size-4 shrink-0 text-red-700" />
            <p>
              Microphone access was blocked. Allow it in your browser&apos;s site settings (the lock
              icon in the address bar), then try again.
            </p>
          </div>
          <Button variant="secondary" className="w-full" onClick={() => void begin()}>
            Try again
          </Button>
        </div>
      ) : null}

      {step === "listening" || step === "heard" ? (
        <div className="space-y-4">
          {devices.length > 1 ? (
            <Select
              value={deviceId}
              onValueChange={(v) => {
                setDeviceId(v);
                void begin(v);
              }}
            >
              <SelectTrigger size="sm">
                <SelectValue placeholder="Microphone" />
              </SelectTrigger>
              <SelectContent>
                {devices.map((d, i) => (
                  <SelectItem key={d.deviceId || i} value={d.deviceId}>
                    {d.label || `Microphone ${i + 1}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs text-secondary">
              <span>Input level</span>
              <span className="font-mono">{Math.round(level * 100)}%</span>
            </div>
            <div className="flex h-2 gap-0.5" aria-hidden>
              {Array.from({ length: 24 }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "flex-1 rounded-xs transition-colors duration-75",
                    i / 24 < level ? (i > 19 ? "bg-red-700" : "bg-green-700") : "bg-gray-300",
                  )}
                />
              ))}
            </div>
          </div>
          <div
            className={cn(
              "rounded-md border p-4 text-center transition-colors",
              step === "heard" ? "border-green-500/50 bg-green-100/40" : "border-border",
            )}
          >
            {step === "heard" ? (
              <p className="flex items-center justify-center gap-2 text-base font-medium text-green-900">
                <Check className="size-4" /> We can hear you clearly.
              </p>
            ) : (
              <>
                <p className="text-base font-medium">Say: &ldquo;I&apos;m ready&rdquo;</p>
                <p className="mt-1 text-xs text-secondary">
                  Listening… {Math.round(Math.min(100, (heardMs / 900) * 100))}%
                </p>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                stop();
                onDone(deviceId || null);
              }}
            >
              Skip
            </Button>
            <Button
              className="flex-1"
              disabled={step !== "heard"}
              onClick={() => {
                stop();
                onDone(deviceId || null);
              }}
            >
              Continue
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
