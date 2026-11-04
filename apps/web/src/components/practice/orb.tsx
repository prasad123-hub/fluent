"use client";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type OrbState =
  | "connecting"
  | "initializing"
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "disconnected"
  | "failed"
  | "pre-connect-buffering";

/**
 * Monochrome audio-reactive orb with a single accent glow.
 * listening → calm pulse · thinking → shimmer sweep · speaking → waveform-driven bulges.
 */
export function Orb({
  state,
  bands,
  size = 240,
  className,
}: {
  state: OrbState;
  bands: number[];
  size?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bandsRef = useRef(bands);
  bandsRef.current = bands;
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    let raf = 0;
    let t = 0;
    const isDark = () => document.documentElement.classList.contains("dark");

    const draw = () => {
      t += 0.016;
      const s = stateRef.current;
      const b = bandsRef.current;
      const energy = b.length ? b.reduce((a, v) => a + v, 0) / b.length : 0;
      const cx = size / 2;
      const cy = size / 2;
      const base = size * 0.3;
      ctx.clearRect(0, 0, size, size);

      let radius = base;
      let glow = 0.18;
      if (s === "listening") {
        radius = base * (1 + 0.025 * Math.sin(t * 1.6));
        glow = 0.22 + 0.06 * Math.sin(t * 1.6);
      } else if (s === "thinking") {
        radius = base * (1 + 0.012 * Math.sin(t * 5));
        glow = 0.3;
      } else if (s === "speaking") {
        radius = base * (1 + Math.min(0.28, energy * 0.9));
        glow = 0.32 + Math.min(0.3, energy);
      } else if (s === "connecting" || s === "initializing" || s === "pre-connect-buffering") {
        radius = base * (1 + 0.015 * Math.sin(t * 2.4));
        glow = 0.12;
      } else if (s === "disconnected" || s === "failed") {
        glow = 0.05;
      }

      // accent glow
      const g = ctx.createRadialGradient(cx, cy, radius * 0.6, cx, cy, radius * 2.1);
      g.addColorStop(0, `rgba(0,112,243,${glow})`);
      g.addColorStop(1, "rgba(0,112,243,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);

      // body: slightly deformed by audio bands
      ctx.beginPath();
      const n = 64;
      for (let i = 0; i <= n; i++) {
        const a = (i / n) * Math.PI * 2;
        const bi = b.length ? (b[Math.floor((i / n) * b.length) % b.length] ?? 0) : 0;
        const wobble =
          s === "speaking"
            ? bi * radius * 0.18 * Math.abs(Math.sin(a * 3 + t * 2))
            : s === "thinking"
              ? radius * 0.015 * Math.sin(a * 6 + t * 4)
              : 0;
        const r = radius + wobble;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      const dark = isDark();
      const body = ctx.createRadialGradient(
        cx - radius * 0.35,
        cy - radius * 0.4,
        radius * 0.1,
        cx,
        cy,
        radius * 1.1,
      );
      if (dark) {
        body.addColorStop(0, "#ffffff");
        body.addColorStop(0.35, "#d4d4d4");
        body.addColorStop(1, "#5a5a5a");
      } else {
        body.addColorStop(0, "#ffffff");
        body.addColorStop(0.4, "#9a9a9a");
        body.addColorStop(1, "#171717");
      }
      ctx.fillStyle = body;
      ctx.fill();

      // thinking shimmer sweep
      if (s === "thinking") {
        ctx.save();
        ctx.clip();
        const sx = cx + Math.sin(t * 2.2) * radius;
        const sh = ctx.createLinearGradient(sx - radius * 0.6, 0, sx + radius * 0.6, 0);
        sh.addColorStop(0, "rgba(255,255,255,0)");
        sh.addColorStop(0.5, "rgba(255,255,255,0.35)");
        sh.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = sh;
        ctx.fillRect(0, 0, size, size);
        ctx.restore();
      }

      // hairline ring
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.32, 0, Math.PI * 2);
      ctx.strokeStyle = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
      ctx.lineWidth = 1;
      ctx.stroke();

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className={cn("select-none", className)}
      aria-hidden
    />
  );
}

/** Thin ring around the learner's mic showing input level. */
export function LevelRing({
  level,
  size = 56,
  children,
}: {
  level: number;
  size?: number;
  children?: React.ReactNode;
}) {
  const r = size / 2 - 3;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, level));
  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--ds-gray-400)"
          strokeWidth="2"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--ds-green-700)"
          strokeWidth="2"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 80ms linear" }}
        />
      </svg>
      {children}
    </div>
  );
}
