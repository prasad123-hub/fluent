import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(totalSec: number | null | undefined): string {
  if (!totalSec || totalSec <= 0) return "0:00";
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatMinutes(totalMin: number): string {
  if (totalMin < 60) return `${Math.round(totalMin)}m`;
  const h = Math.floor(totalMin / 60);
  const m = Math.round(totalMin % 60);
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function formatRelative(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const sec = Math.round(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function formatDate(date: Date | string, opts: Intl.DateTimeFormatOptions = {}): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...opts,
  });
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function round(n: number, digits = 1) {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

export function scoreTone(score: number): "green" | "amber" | "red" | "blue" {
  if (score >= 80) return "green";
  if (score >= 60) return "blue";
  if (score >= 40) return "amber";
  return "red";
}

export function titleCase(s: string) {
  return s.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
