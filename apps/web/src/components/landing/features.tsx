import {
  AudioLines,
  BarChart3,
  Languages,
  LibraryBig,
  TrendingUp,
  Volume2,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DeltaBadge } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";
import { SCENARIO_COUNT, THEME_COUNT } from "./content";
import { Container, SectionHeading } from "./section";

// ───────────────────────────── Visuals (markup only) ─────────────────────────────

const WAVE = [
  3, 6, 10, 16, 22, 14, 9, 18, 26, 20, 12, 7, 15, 24, 17, 10, 6, 13, 21, 15, 8, 4, 9, 5,
];

function VoiceVisual() {
  return (
    <div className="mt-auto space-y-3 rounded-lg border border-border bg-background-100 p-4">
      <div className="flex items-center justify-between">
        <Badge variant="green" size="sm" dot pulse>
          Live
        </Badge>
        <span className="font-mono text-xs text-tertiary tabular">turn latency 0.9s</span>
      </div>
      <div className="flex h-8 items-end gap-[3px]" aria-hidden>
        {WAVE.map((h, i) => (
          <span
            key={i}
            className={cn("w-1 rounded-full", i % 5 === 0 ? "bg-blue-700" : "bg-gray-500")}
            style={{ height: `${h + 4}px` }}
          />
        ))}
      </div>
      <p className="text-sm text-foreground">
        <span className="mr-2 font-mono text-[11px] text-tertiary">Arjun</span>
        Oh, you&apos;ve <em className="text-blue-900 not-italic">been working</em> there for three
        years? That&apos;s solid. What changed this year?
      </p>
    </div>
  );
}

const SKILLS: Array<[string, number]> = [
  ["Grammar", 71],
  ["Vocabulary", 66],
  ["Fluency", 78],
  ["Pronunciation", 62],
  ["Coherence", 74],
  ["Task", 85],
  ["Communication", 80],
  ["Confidence", 69],
];

function AnalysisVisual() {
  return (
    <div className="mt-auto space-y-1.5 rounded-lg border border-border bg-background-100 p-4">
      {SKILLS.map(([label, v]) => (
        <div key={label} className="grid grid-cols-[88px_1fr_28px] items-center gap-2 text-xs">
          <span className="truncate text-secondary">{label}</span>
          <span className="h-1.5 overflow-hidden rounded-full bg-gray-300">
            <span
              className={cn("block h-full rounded-full", v >= 80 ? "bg-green-700" : "bg-gray-700")}
              style={{ width: `${v}%` }}
            />
          </span>
          <span className="text-right font-mono text-tertiary tabular">{v}</span>
        </div>
      ))}
    </div>
  );
}

function ScenariosVisual() {
  const rows: Array<[string, "green" | "blue" | "purple" | "amber", string]> = [
    ["Airport immigration", "green", "A2"],
    ["Asking for a raise", "purple", "B2"],
    ["IELTS Speaking Part 2", "amber", "C1"],
  ];
  return (
    <div className="mt-auto rounded-lg border border-border bg-background-100 p-4">
      <div className="flex items-end justify-between">
        <span className="font-mono text-2xl leading-none font-medium tracking-tight tabular">
          {SCENARIO_COUNT}
        </span>
        <span className="text-xs text-tertiary">{THEME_COUNT} themes</span>
      </div>
      <ul className="mt-3 divide-y divide-border">
        {rows.map(([title, tone, level]) => (
          <li key={title} className="flex items-center justify-between gap-2 py-1.5 text-xs">
            <span className="truncate text-secondary">{title}</span>
            <Badge variant={tone} size="sm">
              {level}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}

const PAIRS: Array<[string, string, number]> = [
  ["ship", "sheep", 92],
  ["vine", "wine", 64],
  ["think", "tink", 58],
];

function PronunciationVisual() {
  return (
    <div className="mt-auto rounded-lg border border-border bg-background-100 p-4">
      <ul className="space-y-2.5">
        {PAIRS.map(([a, b, score]) => (
          <li key={a} className="grid grid-cols-[1fr_1fr_auto] items-center gap-3 text-sm">
            <span className="font-mono text-foreground">
              {a} <span className="text-tertiary">/</span> {b}
            </span>
            <span className="h-1.5 overflow-hidden rounded-full bg-gray-300">
              <span
                className={cn(
                  "block h-full rounded-full",
                  score >= 80 ? "bg-green-700" : score >= 60 ? "bg-amber-700" : "bg-red-700",
                )}
                style={{ width: `${score}%` }}
              />
            </span>
            <span className="w-9 text-right font-mono text-xs text-secondary tabular">
              {score}%
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-tertiary">
        Weak sound this week: <span className="font-mono text-foreground">/θ/</span> — tongue
        between the teeth, then release.
      </p>
    </div>
  );
}

const TREND = [58, 61, 59, 64, 66, 65, 70, 69, 72, 71, 74, 76];

function ProgressVisual() {
  const w = 320;
  const h = 72;
  const min = 50;
  const max = 80;
  const points = TREND.map((v, i) => {
    const x = (i / (TREND.length - 1)) * w;
    const y = h - ((v - min) / (max - min)) * h;
    return [x, y] as const;
  });
  const line = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = points[points.length - 1] ?? [w, h / 2];
  return (
    <div className="mt-auto rounded-lg border border-border bg-background-100 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-secondary">Overall score · last 12 sessions</p>
          <p className="mt-1 flex items-end gap-2">
            <span className="font-mono text-2xl leading-none font-medium tracking-tight tabular">
              76
            </span>
            <DeltaBadge value={4.2} />
          </p>
        </div>
        <Badge variant="blue" size="sm">
          B2
        </Badge>
      </div>
      <svg
        viewBox={`0 0 ${w} ${h + 8}`}
        className="mt-3 h-20 w-full"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="trend-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0070f3" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0070f3" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={`0,${h} ${line} ${w},${h}`} fill="url(#trend-fill)" />
        <polyline
          points={line}
          fill="none"
          stroke="#0070f3"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={last[0]} cy={last[1]} r="3" fill="#0070f3" />
      </svg>
    </div>
  );
}

function HinglishVisual() {
  return (
    <div className="mt-auto space-y-3 rounded-lg border border-border bg-background-100 p-4">
      <p className="text-sm text-secondary">
        <span className="mr-2 font-mono text-[11px] text-tertiary">You</span>I was thinking{" "}
        <mark className="rounded-xs bg-amber-100 px-1 text-amber-900">ki</mark> we should{" "}
        <span className="underline decoration-amber-700 decoration-dotted underline-offset-4">
          prepone
        </span>{" "}
        the review, um, basically to Thursday.
      </p>
      <p className="rounded-md border border-border bg-background-200 px-2.5 py-1.5 text-xs text-foreground">
        <span className="text-green-900">Say it better:</span> I think we should move the review
        earlier, to Thursday.
      </p>
      <div className="flex flex-wrap gap-1.5 font-mono text-[11px] text-tertiary">
        <span className="rounded-full border border-border px-2 py-0.5">um ×3</span>
        <span className="rounded-full border border-border px-2 py-0.5">basically ×2</span>
        <span className="rounded-full border border-border px-2 py-0.5">code-switch ×1</span>
      </div>
    </div>
  );
}

// ───────────────────────────── Grid ─────────────────────────────

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  visual: React.ReactNode;
  className: string;
}

const FEATURES: Feature[] = [
  {
    icon: AudioLines,
    title: "Real-time voice coaching",
    description:
      "Talk naturally, interrupt, pause. The coach stays in character and recasts your mistakes mid-conversation, or stays silent until the report, depending on the mode you pick.",
    visual: <VoiceVisual />,
    className: "md:col-span-2",
  },
  {
    icon: BarChart3,
    title: "Deep analysis",
    description:
      "Eight skills scored from the transcript and audio, with evidence for every point: what you said, why it mattered, what to say instead.",
    visual: <AnalysisVisual />,
    className: "",
  },
  {
    icon: LibraryBig,
    title: `${SCENARIO_COUNT} scenarios, ${THEME_COUNT} themes`,
    description:
      "From small talk in the lift to a panel interview or an IELTS Part 3, every scenario comes with a goal, key phrases and the mistakes to watch.",
    visual: <ScenariosVisual />,
    className: "",
  },
  {
    icon: Volume2,
    title: "Pronunciation lab",
    description:
      "Minimal pairs, word stress, intonation and shadowing drills tuned for sounds Indian speakers mix up, with a similarity score on every attempt.",
    visual: <PronunciationVisual />,
    className: "md:col-span-2",
  },
  {
    icon: TrendingUp,
    title: "Progress you can see",
    description:
      "Trends per skill, words per minute, filler rate and vocabulary level across every session, with a CEFR band that moves as you do.",
    visual: <ProgressVisual />,
    className: "lg:col-span-2",
  },
  {
    icon: Languages,
    title: "Hinglish-aware",
    description:
      "Code-switches, fillers and Indian-English patterns are spotted and rephrased without ever breaking your flow.",
    visual: <HinglishVisual />,
    className: "",
  },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-14 py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="What you get"
          title="Everything you need to actually improve"
          description="Not flashcards. Conversations with a coach that hears every word, then shows you the evidence."
        />
        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className={cn(
                "flex min-h-[320px] flex-col gap-4 bg-background-100 p-6 transition-colors duration-200 hover:bg-background-200",
                f.className,
              )}
            >
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-md border border-border bg-background-300 text-secondary">
                  <f.icon className="size-4" strokeWidth={1.5} />
                </span>
                <h3 className="text-md font-semibold tracking-tight">{f.title}</h3>
              </div>
              <p className="max-w-md text-sm text-secondary">{f.description}</p>
              {f.visual}
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
