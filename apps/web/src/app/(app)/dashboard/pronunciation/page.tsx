import Link from "next/link";
import { AudioLines, Ear, Mic, Sparkles, Waves } from "lucide-react";
import { requireOwnerPage } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import { PageHeader, SectionTitle } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Bars } from "@/components/charts";
import {
  PRON_DRILL_IDS,
  drillForPhoneme,
  phonemeLabel,
  practiceHref,
  type PronDrillId,
} from "@/components/dashboard/drills";
import { PronunciationLab, type WordRow } from "@/components/dashboard/pronunciation-lab";

export const metadata = { title: "Pronunciation" };
export const dynamic = "force-dynamic";

interface PronMetrics {
  meanConfidence?: number;
  lowConfidenceWords?: {
    word: string;
    confidence: number;
    atMs: number;
    phoneme?: string | null;
  }[];
  l1Flags?: { phoneme: string; words: string[] }[];
}

const DRILL_BLURBS: Record<PronDrillId, string> = {
  "pron-v-vs-w": "Village vs. willage — the classic Indian English pair.",
  "pron-th-sounds": "Three, think, this, that — tongue between the teeth.",
  "pron-ee-vs-i": "Ship or sheep? Long and short vowels side by side.",
  "pron-word-stress": "Put the stress where native listeners expect it.",
  "pron-sentence-intonation": "Rise and fall so questions sound like questions.",
  "pron-linking-reductions": "Connect words the way fluent speakers do.",
  "pron-shadowing": "Repeat right behind the agent, matching rhythm and pace.",
  "pron-tongue-twisters": "Fast, playful drills for tricky clusters.",
  "pron-read-aloud-passage": "Read a short passage and get sound-level feedback.",
};

export default async function PronunciationPage() {
  const owner = await requireOwnerPage();
  const [profile, reports, drills] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId: owner.id } }),
    prisma.analysisReport.findMany({
      where: { session: { userId: owner.id } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        metrics: true,
        createdAt: true,
        session: { select: { id: true, scenarioTitle: true, createdAt: true } },
      },
    }),
    prisma.scenario.findMany({
      where: { id: { in: [...PRON_DRILL_IDS] } },
      select: { id: true, title: true, difficulty: true, suggestedDurationMin: true },
    }),
  ]);

  const weakPhonemes = Array.isArray(profile?.weakPhonemes)
    ? (profile.weakPhonemes as unknown[]).filter((p): p is string => typeof p === "string")
    : [];

  // ── Aggregate the last 20 reports ─────────────────────────────────────────
  const sounds = new Map<string, { count: number; words: Set<string> }>();
  const words = new Map<string, WordRow>();
  const phonemeVotes = new Map<string, Map<string, number>>();
  const confidences: number[] = [];

  for (const r of reports) {
    const pron = (r.metrics as { deterministic?: { pronunciation?: PronMetrics } } | null)
      ?.deterministic?.pronunciation;
    if (!pron) continue;
    if (typeof pron.meanConfidence === "number") confidences.push(pron.meanConfidence);
    for (const flag of pron.l1Flags ?? []) {
      const s = sounds.get(flag.phoneme) ?? { count: 0, words: new Set<string>() };
      s.count += flag.words.length;
      for (const w of flag.words) s.words.add(w.toLowerCase());
      sounds.set(flag.phoneme, s);
    }
    for (const w of pron.lowConfidenceWords ?? []) {
      const key = w.word.toLowerCase();
      const votes = phonemeVotes.get(key) ?? new Map<string, number>();
      if (w.phoneme) votes.set(w.phoneme, (votes.get(w.phoneme) ?? 0) + 1);
      phonemeVotes.set(key, votes);
      const existing = words.get(key);
      if (existing) {
        existing.times += 1;
        existing.lowest = Math.min(existing.lowest, w.confidence);
      } else {
        // Reports are newest-first, so the first sighting is the most recent session.
        words.set(key, {
          word: key,
          phoneme: w.phoneme ?? null,
          lowest: w.confidence,
          times: 1,
          lastSessionId: r.session.id,
          lastSessionTitle: r.session.scenarioTitle,
          lastAt: r.session.createdAt.toISOString(),
        });
      }
    }
  }
  for (const [key, row] of words) {
    const votes = phonemeVotes.get(key);
    if (votes?.size) row.phoneme = [...votes.entries()].sort((a, b) => b[1] - a[1])[0]![0];
  }
  for (const p of weakPhonemes) if (!sounds.has(p)) sounds.set(p, { count: 0, words: new Set() });

  const soundRows = [...sounds.entries()].sort((a, b) => b[1].count - a[1].count);
  const wordRows = [...words.values()].sort((a, b) => b.times - a.times || a.lowest - b.lowest);
  const meanConfidence = confidences.length
    ? confidences.reduce((a, b) => a + b, 0) / confidences.length
    : null;

  const topPhoneme = weakPhonemes[0] ?? soundRows[0]?.[0] ?? null;
  const recommended: PronDrillId = (topPhoneme && drillForPhoneme(topPhoneme)) || "pron-shadowing";
  const drillMeta = new Map(drills.map((d) => [d.id, d]));

  const hasData = soundRows.length > 0 || wordRows.length > 0;

  return (
    <>
      <PageHeader
        title="Pronunciation"
        description="Sounds the analysis flagged, with a reference to copy and a way to hear yourself."
        actions={
          <Button asChild prefix={<Sparkles />}>
            <Link href={practiceHref(recommended)}>
              {drillMeta.get(recommended)?.title ?? "Start a drill"}
            </Link>
          </Button>
        }
      />

      {!hasData ? (
        <EmptyState
          icon={AudioLines}
          title="No pronunciation data yet"
          description="After your first analysed session the words and sounds that need attention land here, with reference audio and drills."
          action={
            <Button asChild prefix={<Mic />}>
              <Link href="/practice">Start practicing</Link>
            </Button>
          }
          className="mb-8"
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Clarity"
              value={meanConfidence === null ? "—" : `${Math.round(meanConfidence * 100)}%`}
              hint="How confidently the transcriber heard you across recent sessions"
              icon={<Ear />}
            />
            <StatCard
              label="Sounds to work on"
              value={soundRows.length}
              hint={topPhoneme ? `Top priority: ${phonemeLabel(topPhoneme)}` : "Nothing flagged"}
              icon={<Waves />}
            />
            <StatCard
              label="Words flagged"
              value={wordRows.length}
              hint={`From your last ${reports.length} analysed sessions`}
              icon={<AudioLines />}
            />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Weak sounds</CardTitle>
                <CardDescription>How often each sound was flagged in your speech.</CardDescription>
              </CardHeader>
              <CardContent>
                <Bars
                  horizontal
                  data={soundRows.map(([p, s]) => ({ x: phonemeLabel(p), value: s.count }))}
                  name="Flags"
                  height={Math.max(140, soundRows.length * 44)}
                  highlightFirst
                />
                <ul className="mt-3 space-y-1.5">
                  {soundRows.slice(0, 4).map(([p, s]) => (
                    <li key={p} className="flex items-baseline gap-2 text-xs text-secondary">
                      <span className="font-medium text-foreground">{phonemeLabel(p)}</span>
                      <span className="truncate">
                        {s.words.size ? [...s.words].slice(0, 5).join(", ") : "from your profile"}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <div className="lg:col-span-3">
              <PronunciationLab rows={wordRows} />
            </div>
          </div>
        </>
      )}

      <section className="mt-8">
        <SectionTitle
          title="Minimal-pair drills"
          description="Short, focused voice sessions. The highlighted one matches your top weak sound."
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {PRON_DRILL_IDS.map((id) => {
            const meta = drillMeta.get(id);
            const isRec = id === recommended;
            return (
              <Card key={id} className={cn("flex flex-col", isRec && "border-blue-700 glow-frame")}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{meta?.title ?? id}</CardTitle>
                    {isRec ? (
                      <Badge variant="blue" dot size="sm">
                        Recommended
                      </Badge>
                    ) : null}
                  </div>
                  <CardDescription>{DRILL_BLURBS[id]}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto flex items-center justify-between pt-4">
                  <span className="font-mono text-xs text-tertiary tabular">
                    {meta ? `${meta.difficulty} · ${meta.suggestedDurationMin} min` : "Drill"}
                  </span>
                  <Button
                    asChild
                    variant={isRec ? "primary" : "secondary"}
                    size="sm"
                    prefix={<Mic />}
                  >
                    <Link href={practiceHref(id)}>Start</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </>
  );
}
