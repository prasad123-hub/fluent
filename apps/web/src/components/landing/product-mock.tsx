import {
  Captions,
  Gauge,
  HelpCircle,
  Mic,
  PhoneOff,
  Radio,
  Repeat,
  Target,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CONTROLS: Array<{ icon: LucideIcon; label: string; tone?: "danger" | "active" }> = [
  { icon: Mic, label: "Mute", tone: "active" },
  { icon: Radio, label: "Push to talk" },
  { icon: HelpCircle, label: "Help me" },
  { icon: Repeat, label: "Repeat that" },
  { icon: Gauge, label: "Slower" },
  { icon: Captions, label: "Captions" },
  { icon: PhoneOff, label: "End", tone: "danger" },
];

const KEY_PHRASES = [
  "I'd like to take leave from the 12th to the 16th.",
  "I've already handed over the release checklist.",
  "Would that work for the team?",
];

/** A static, markup-only recreation of the live Practice page used in the hero. */
export function ProductMock({ className }: { className?: string }) {
  return (
    <div
      role="img"
      aria-label="Preview of a live Fluent practice session: the coaching orb, live captions and the control bar"
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-background-200 glow-frame select-none",
        className,
      )}
    >
      {/* top bar */}
      <div className="flex h-11 items-center gap-3 border-b border-border px-4">
        <span className="flex size-5 items-center justify-center rounded-md border border-border bg-background-300">
          <span className="size-2 rounded-full border-[1.5px] border-foreground" />
        </span>
        <span className="truncate text-sm font-medium">Asking a manager for leave</span>
        <Badge variant="gray" size="sm" className="hidden sm:inline-flex">
          Gentle
        </Badge>
        <div className="ml-auto flex items-center gap-3">
          <Badge variant="green" size="sm" dot pulse>
            Live
          </Badge>
          <span className="font-mono text-xs text-secondary tabular">04:12</span>
          <span className="hidden h-7 items-center rounded-sm border border-red-500/60 px-2.5 text-xs font-medium text-red-700 sm:inline-flex">
            End
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_240px]">
        {/* stage */}
        <div className="relative flex flex-col items-center px-4 pt-10 pb-6 sm:pt-12">
          <div className="absolute inset-0 grid-dots [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_65%)] opacity-60" />
          <div className="relative">
            <div className="absolute inset-0 -m-10 rounded-full bg-blue-700/25 blur-3xl" />
            <div className="relative size-36 animate-pulse-soft rounded-full border border-border bg-[radial-gradient(circle_at_35%_30%,#2a2a2a,#0a0a0a_70%)] shadow-[inset_0_0_40px_rgba(255,255,255,0.06)] sm:size-44">
              <div className="absolute inset-3 rounded-full border border-white/5" />
              <div className="absolute inset-[38%] rounded-full bg-blue-700/60 blur-md" />
            </div>
            <span className="absolute inset-x-0 -bottom-7 text-center font-mono text-[11px] tracking-wide text-tertiary uppercase">
              Listening
            </span>
          </div>

          {/* captions */}
          <div className="relative mt-14 w-full max-w-md space-y-2.5 rounded-lg border border-border bg-background-100/80 p-4 text-left backdrop-blur-sm">
            <p className="text-sm leading-5 text-foreground">
              <span className="mr-2 font-mono text-[11px] text-tertiary">Priya</span>
              Sure, what dates are you thinking of? And is the release on track?
            </p>
            <p className="text-sm leading-5 text-secondary">
              <span className="mr-2 font-mono text-[11px] text-tertiary">You</span>I was thinking
              the 12th to the 16th. I have already{" "}
              <span className="underline decoration-amber-700 decoration-dotted underline-offset-4">
                handed over
              </span>{" "}
              the checklist to Rahul…
            </p>
          </div>

          {/* control pill */}
          <div className="relative mt-5 flex items-center gap-1 rounded-full border border-border bg-background-300/90 p-1 shadow-menu">
            {CONTROLS.map((c) => (
              <span
                key={c.label}
                title={c.label}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-secondary",
                  c.tone === "active" && "bg-background-100 text-foreground",
                  c.tone === "danger" && "bg-red-700 text-white",
                )}
              >
                <c.icon className="size-4" strokeWidth={1.5} />
              </span>
            ))}
          </div>
        </div>

        {/* side panel */}
        <aside className="hidden border-l border-border bg-background-100/40 p-4 text-left lg:block">
          <p className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-tertiary uppercase">
            <Target className="size-3" strokeWidth={1.5} /> Goal
          </p>
          <p className="mt-2 text-sm text-secondary">
            Ask for four days of leave, explain the handover and agree on who covers the release.
          </p>
          <p className="mt-5 text-xs font-medium tracking-wide text-tertiary uppercase">
            Key phrases
          </p>
          <ul className="mt-2 space-y-1.5">
            {KEY_PHRASES.map((p) => (
              <li
                key={p}
                className="rounded-md border border-border bg-background-200 px-2.5 py-1.5 text-xs text-foreground"
              >
                {p}
              </li>
            ))}
          </ul>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className="rounded-md border border-border bg-background-200 px-2.5 py-2">
              <p className="text-[11px] text-tertiary">Fillers</p>
              <p className="font-mono text-sm tabular">2</p>
            </div>
            <div className="rounded-md border border-border bg-background-200 px-2.5 py-2">
              <p className="text-[11px] text-tertiary">Words / min</p>
              <p className="font-mono text-sm tabular">126</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
