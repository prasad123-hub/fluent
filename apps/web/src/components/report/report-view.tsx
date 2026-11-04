"use client";
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, Download, FileText, Mic, Printer, X } from "lucide-react";
import type { AnalysisReport } from "@fluent/shared";
import {
  COACHING_MODE_INFO,
  CORE_SKILLS,
  SKILL_LABELS,
  type CoachingModeKey,
} from "@fluent/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard, DeltaBadge } from "@/components/ui/stat-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/ui/page-header";
import { Heatmap, SkillsRadar, TrendChart } from "@/components/charts";
import type { ReportEvent, ReportUtterance, SessionReportData } from "@/lib/queries/report";
import { cn, formatDate, formatDuration, titleCase } from "@/lib/utils";

const DIFF_TONE: Record<string, "green" | "blue" | "purple" | "amber"> = {
  A2: "green",
  B1: "blue",
  B2: "purple",
  C1: "amber",
};

export function ReportView({ data }: { data: SessionReportData & { report: AnalysisReport } }) {
  const { session, report, utterances, events } = data;
  const det = report.deterministic;
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioMs, setAudioMs] = useState(0);

  const radar = CORE_SKILLS.map((k) => ({
    skill: SKILL_LABELS[k],
    value: Math.round(report.skills[k]),
  }));
  const wpmSeries = det.wpmSeries.map((p) => ({ x: `${p.minute}m`, wpm: Math.round(p.wpm) }));
  const pausesPerMinute = useMemo(() => {
    const minutes = Math.max(
      1,
      Math.ceil(Math.max(...utterances.map((u) => u.endMs), 60000) / 60000),
    );
    const arr = Array.from({ length: minutes }, () => 0);
    det.pauses.list.forEach((p) => {
      const i = Math.min(minutes - 1, Math.floor(p.atMs / 60000));
      arr[i] = (arr[i] ?? 0) + 1;
    });
    return arr;
  }, [det.pauses.list, utterances]);
  const fillersPerMinute = useMemo(() => {
    const minutes = pausesPerMinute.length;
    const arr = Array.from({ length: minutes }, () => 0);
    det.fillers.hits.forEach((h) => {
      const i = Math.min(minutes - 1, Math.floor(h.atMs / 60000));
      arr[i] = (arr[i] ?? 0) + 1;
    });
    return arr;
  }, [det.fillers.hits, pausesPerMinute.length]);
  const errorsByCategory = useMemo(() => {
    const m = new Map<string, AnalysisReport["grammarErrors"]>();
    report.grammarErrors.forEach((e) => m.set(e.category, [...(m.get(e.category) ?? []), e]));
    return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [report.grammarErrors]);
  const timeline = wpmSeries.map((p, i) => ({ ...p, pauses: pausesPerMinute[i] ?? 0 }));

  const downloadTranscript = () => {
    const text = utterances
      .map(
        (u) =>
          `[${formatDuration(u.startMs / 1000)}] ${u.speaker === "human" ? "You" : (u.agentCharacter ?? session.personaName)}: ${u.text}`,
      )
      .join("\n");
    const blob = new Blob(
      [`${session.scenarioTitle} — ${formatDate(session.startedAt ?? new Date())}\n\n${text}\n`],
      { type: "text/plain" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `fluent-transcript-${session.id}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-8 print:space-y-4">
      <PageHeader
        title={session.scenarioTitle}
        description={`${formatDate(session.startedAt ?? session.endedAt ?? new Date(), { weekday: "short" })} · ${COACHING_MODE_INFO[session.coachingMode as CoachingModeKey]?.label ?? session.coachingMode} · ${session.difficulty} · ${formatDuration(session.durationSec)} with ${session.personaName}`}
        actions={
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button
              variant="secondary"
              size="sm"
              prefix={<FileText />}
              onClick={downloadTranscript}
            >
              Transcript
            </Button>
            <Button
              variant="secondary"
              size="sm"
              prefix={<Printer />}
              onClick={() => window.print()}
            >
              Export PDF
            </Button>
            <Button asChild size="sm" prefix={<Mic />}>
              <Link
                href={session.scenarioId ? `/practice?scenario=${session.scenarioId}` : "/practice"}
              >
                Practice again
              </Link>
            </Button>
          </div>
        }
      />

      {/* score cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Overall"
          value={Math.round(report.overall)}
          delta={report.deltas?.overall ?? null}
          hint="vs your previous 5 sessions"
        />
        <StatCard label="Level this session" value={report.cefr} hint="CEFR estimate" />
        <StatCard
          label="Pace"
          value={Math.round(det.wpm)}
          unit="wpm"
          delta={report.deltas?.wpm ?? null}
          hint="target 120–160"
        />
        <StatCard
          label="Fillers"
          value={det.fillers.per100Words}
          unit="/100 words"
          delta={report.deltas?.fillersPer100 ?? null}
          invertDelta
          hint={
            Object.entries(det.fillers.byWord)
              .slice(0, 3)
              .map(([w, c]) => `${w} ×${c}`)
              .join(" · ") || "none"
          }
        />
      </section>

      {/* summary + radar */}
      <section className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>Specific, honest, encouraging</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-md leading-7">{report.summary}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-medium tracking-wide text-green-900 uppercase">
                  Strengths
                </p>
                <ul className="space-y-2">
                  {report.strengths.map((s) => (
                    <li key={s.title} className="rounded-md border border-border p-3">
                      <p className="text-sm font-medium">{s.title}</p>
                      <p className="mt-0.5 text-xs text-secondary">“{s.example}”</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium tracking-wide text-amber-900 uppercase">
                  Priorities
                </p>
                <ul className="space-y-2">
                  {report.priorities.map((p) => (
                    <li key={p.title} className="rounded-md border border-border p-3">
                      <p className="text-sm font-medium">{p.title}</p>
                      <p className="mt-0.5 text-xs text-secondary">
                        <span className="line-through decoration-red-700/60">{p.example}</span> →{" "}
                        <span className="text-green-900">{p.fix}</span>
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Skills</CardTitle>
            <CardDescription>Eight core skills, 0–100</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <SkillsRadar data={radar} height={230} />
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              {CORE_SKILLS.map((k) => (
                <li key={k} className="flex items-center justify-between gap-2">
                  <span className="text-secondary">{SKILL_LABELS[k]}</span>
                  <span className="flex items-center gap-1.5 font-mono tabular">
                    {Math.round(report.skills[k])}
                    <DeltaBadge value={report.deltas?.[k] ?? null} />
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* tabs */}
      <Tabs defaultValue="transcript" className="print:hidden">
        <TabsList className="flex-wrap">
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
          <TabsTrigger value="grammar">Grammar ({report.grammarErrors.length})</TabsTrigger>
          <TabsTrigger value="fluency">Fluency</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
          <TabsTrigger value="vocab">Vocabulary</TabsTrigger>
          <TabsTrigger value="task">Task</TabsTrigger>
        </TabsList>

        <TabsContent value="transcript">
          <Card>
            <CardHeader>
              <CardTitle>Transcript</CardTitle>
              <CardDescription>
                Hover a highlighted phrase for the correction. Low-confidence words are
                dotted-underlined.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {session.recordingUrl ? (
                <div className="rounded-md border border-border bg-background-300 p-3">
                  <audio
                    ref={audioRef}
                    controls
                    preload="metadata"
                    src={session.recordingUrl}
                    className="w-full"
                    onTimeUpdate={(e) => setAudioMs(e.currentTarget.currentTime * 1000)}
                  />
                  <p className="mt-1 text-xs text-tertiary">
                    Playback is synced to the transcript below.
                  </p>
                </div>
              ) : (
                <p className="rounded-md border border-dashed border-border p-3 text-xs text-tertiary">
                  No recording for this session. Turn on “Record sessions” in Settings to get synced
                  audio playback (needs S3-compatible storage).
                </p>
              )}
              <Transcript
                utterances={utterances}
                errors={report.grammarErrors}
                events={events}
                personaName={session.personaName}
                activeMs={audioMs}
                onSeek={(ms) => {
                  if (audioRef.current) {
                    audioRef.current.currentTime = ms / 1000;
                    void audioRef.current.play();
                  }
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grammar">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Errors by category</CardTitle>
                <CardDescription>{report.judged.grammar.comment}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-0">
                {errorsByCategory.length === 0 ? (
                  <p className="p-5 text-sm text-secondary">
                    No grammar errors were found. Excellent.
                  </p>
                ) : null}
                {errorsByCategory.map(([cat, errs]) => (
                  <div key={cat}>
                    <div className="flex items-center gap-2 px-5 pt-4">
                      <h3 className="text-sm font-semibold">{titleCase(cat)}</h3>
                      <Badge size="sm">{errs.length}</Badge>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>You said</TableHead>
                          <TableHead>Better</TableHead>
                          <TableHead>Why</TableHead>
                          <TableHead className="w-20">Severity</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {errs.map((e, i) => (
                          <TableRow key={i}>
                            <TableCell className="max-w-[220px] text-red-900">{e.quote}</TableCell>
                            <TableCell className="max-w-[220px] text-green-900">
                              {e.correction}
                            </TableCell>
                            <TableCell className="max-w-[320px] text-secondary">
                              {e.explanation}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  e.severity >= 3 ? "red" : e.severity === 2 ? "amber" : "gray"
                                }
                                size="sm"
                              >
                                {["", "minor", "moderate", "major"][e.severity]}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Say it better</CardTitle>
                <CardDescription>Your sentences, upgraded</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {report.rewrites.length === 0 ? (
                  <p className="text-sm text-secondary">Nothing to rewrite this time.</p>
                ) : null}
                {report.rewrites.map((r, i) => (
                  <div key={i} className="rounded-md border border-border p-3">
                    <p className="text-sm text-secondary">“{r.original}”</p>
                    <p className="mt-1.5 text-sm font-medium">“{r.better}”</p>
                    <p className="mt-1 text-xs text-tertiary">{r.why}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="fluency">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Pace and pauses</CardTitle>
                <CardDescription>
                  Words per minute and long pauses, minute by minute
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                {timeline.length ? (
                  <TrendChart
                    data={timeline}
                    series={[
                      { key: "wpm", name: "WPM" },
                      { key: "pauses", name: "Long pauses", color: "var(--ds-purple-700)" },
                    ]}
                    area={false}
                    height={200}
                  />
                ) : (
                  <p className="text-sm text-secondary">Not enough speech for a timeline.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Filler words</CardTitle>
                <CardDescription>
                  {det.fillers.total} total · {det.fillers.per100Words} per 100 words
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Heatmap
                  cells={fillersPerMinute}
                  labels={fillersPerMinute.map((_, i) => `${i}m`)}
                  caption="Darker = more fillers in that minute"
                />
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(det.fillers.byWord).map(([w, c]) => (
                    <Badge key={w} variant="amber" size="sm">
                      {w} ×{c}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-secondary">{report.judged.fluency.comment}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Turn-taking</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Your turns", det.turnTaking.userTurns],
                  ["Avg turn", `${det.turnTaking.avgUserTurnSec}s`],
                  ["Talk share", `${det.talkSharePct}%`],
                  ["Response latency", `${Math.round(det.meanResponseLatencyMs / 100) / 10}s`],
                  ["Interruptions made", det.turnTaking.interruptionsMade],
                  ["Hints used", det.turnTaking.hintsUsed],
                  ["Repetitions", det.repetitions.count],
                  ["Code-switches", det.codeSwitches.count],
                ].map(([k, v]) => (
                  <div key={String(k)} className="rounded-md border border-border p-3">
                    <p className="text-xs text-secondary">{k}</p>
                    <p className="mt-1 font-mono text-lg tabular">{v}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Pronunciation</CardTitle>
                <CardDescription>{report.judged.pronunciation.comment}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">
                  Mean word confidence{" "}
                  <span className="font-mono tabular">
                    {Math.round(det.pronunciation.meanConfidence * 100)}%
                  </span>
                </p>
                {det.pronunciation.l1Flags.map((f) => (
                  <div key={f.phoneme} className="flex flex-wrap items-center gap-1.5 text-sm">
                    <Badge variant="purple" size="sm">
                      {f.phoneme}
                    </Badge>
                    {f.words.map((w) => (
                      <span
                        key={w}
                        className="rounded-sm border border-border px-1.5 py-0.5 font-mono text-xs"
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                ))}
                {det.pronunciation.lowConfidenceWords.length === 0 ? (
                  <p className="text-sm text-secondary">No words were flagged as unclear.</p>
                ) : null}
                <Link
                  href="/dashboard/pronunciation"
                  className="text-sm text-blue-700 hover:underline"
                >
                  Open the pronunciation lab →
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="communication">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Communication skills</CardTitle>
                <CardDescription>{report.judged.communication.comment}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(
                  [
                    ["Structure", "structure"],
                    ["Conciseness", "conciseness"],
                    ["Active listening", "activeListening"],
                    ["Register", "register"],
                    ["Assertiveness", "assertiveness"],
                    ["Asking questions", "questionAsking"],
                    ["Empathy", "empathy"],
                    ["Persuasiveness", "persuasiveness"],
                    ["Confidence (low hedging)", "hedging"],
                  ] as const
                ).map(([label, key]) => (
                  <div key={key}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{label}</span>
                      <span className="font-mono text-secondary tabular">
                        {Math.round(report.judged.communication[key])}
                      </span>
                    </div>
                    <Progress
                      value={report.judged.communication[key]}
                      size="sm"
                      tone={
                        report.judged.communication[key] >= 75
                          ? "green"
                          : report.judged.communication[key] >= 55
                            ? "blue"
                            : "amber"
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
            <div className="space-y-4">
              {report.judged.interview ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Interview lens</CardTitle>
                    <CardDescription>
                      Hireability estimate{" "}
                      <span className="font-mono text-foreground">
                        {Math.round(report.judged.interview.hireability)}
                      </span>
                      /100
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>
                      Answer structure{" "}
                      <span className="font-mono tabular">
                        {Math.round(report.judged.interview.answerStructure)}
                      </span>{" "}
                      · Relevance{" "}
                      <span className="font-mono tabular">
                        {Math.round(report.judged.interview.relevance)}
                      </span>
                    </p>
                    <p className="text-secondary">{report.judged.interview.reasons}</p>
                    {report.judged.interview.redFlags.length ? (
                      <ul className="list-inside list-disc text-red-900">
                        {report.judged.interview.redFlags.map((f) => (
                          <li key={f}>{f}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-green-900">No red flags.</p>
                    )}
                  </CardContent>
                </Card>
              ) : null}
              {report.judged.ielts ? (
                <Card>
                  <CardHeader>
                    <CardTitle>IELTS band estimate</CardTitle>
                    <CardDescription>
                      Overall{" "}
                      <span className="font-mono text-foreground">
                        {report.judged.ielts.overall.toFixed(1)}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      ["Fluency & coherence", report.judged.ielts.fluencyCoherence],
                      ["Lexical resource", report.judged.ielts.lexicalResource],
                      ["Grammar range & accuracy", report.judged.ielts.grammaticalRange],
                      ["Pronunciation", report.judged.ielts.pronunciation],
                    ].map(([k, v]) => (
                      <div key={String(k)} className="rounded-md border border-border p-3">
                        <p className="text-xs text-secondary">{k}</p>
                        <p className="mt-1 font-mono text-lg tabular">{Number(v).toFixed(1)}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : null}
              <Card>
                <CardHeader>
                  <CardTitle>Confidence index</CardTitle>
                  <CardDescription>
                    Hedging, assertiveness, response latency and fillers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="font-mono text-3xl tabular">{Math.round(report.confidenceIndex)}</p>
                  <Progress value={report.confidenceIndex} className="mt-3" tone="blue" />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="vocab">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Range</CardTitle>
                <CardDescription>{report.judged.vocabulary.comment}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    ["Words", det.vocabulary.totalWords],
                    ["Unique", det.vocabulary.uniqueWords],
                    ["Level", det.vocabulary.estimatedLevel],
                  ].map(([k, v]) => (
                    <div key={String(k)} className="rounded-md border border-border p-3">
                      <p className="text-xs text-secondary">{k}</p>
                      <p className="mt-1 font-mono text-lg tabular">{v}</p>
                    </div>
                  ))}
                </div>
                <p>
                  Beyond the 2,000 most common words:{" "}
                  <span className="font-mono tabular">
                    {Math.round(100 - det.vocabulary.pctTop2k)}%
                  </span>{" "}
                  · lexical diversity (MATTR){" "}
                  <span className="font-mono tabular">{det.vocabulary.mattr}</span>
                </p>
                {det.vocabulary.advancedWords.length ? (
                  <p className="flex flex-wrap gap-1.5">
                    <span className="text-secondary">Advanced words you used:</span>
                    {det.vocabulary.advancedWords.map((w) => (
                      <Badge key={w} variant="green" size="sm">
                        {w}
                      </Badge>
                    ))}
                  </p>
                ) : null}
                {det.vocabulary.overusedWords.length ? (
                  <p className="flex flex-wrap gap-1.5">
                    <span className="text-secondary">Overused:</span>
                    {det.vocabulary.overusedWords.map((w) => (
                      <Badge key={w.word} variant="amber" size="sm">
                        {w.word} ×{w.count}
                      </Badge>
                    ))}
                  </p>
                ) : null}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Words to learn</CardTitle>
                <CardDescription>Added to your vocabulary bank</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {report.vocabBank.map((v) => (
                  <div key={v.word} className="rounded-md border border-border p-3">
                    <p className="text-sm font-medium">
                      {v.word}{" "}
                      {v.ipa ? (
                        <span className="ml-1 font-mono text-xs text-tertiary">{v.ipa}</span>
                      ) : null}{" "}
                      {v.partOfSpeech ? (
                        <span className="ml-1 text-xs text-tertiary">{v.partOfSpeech}</span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-xs text-secondary">{v.definition}</p>
                    <p className="mt-0.5 text-xs text-tertiary italic">{v.example}</p>
                  </div>
                ))}
                <Link
                  href="/dashboard/vocabulary"
                  className="inline-block text-sm text-blue-700 hover:underline"
                >
                  Review flashcards →
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="task">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Scenario goals</CardTitle>
                <CardDescription>{report.judged.taskAchievement.comment}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {report.taskCriteria.map((c) => (
                  <div key={c.criterion} className="flex gap-3 rounded-md border border-border p-3">
                    <span
                      className={cn(
                        "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                        c.met ? "bg-green-100 text-green-900" : "bg-red-100 text-red-900",
                      )}
                    >
                      {c.met ? <Check className="size-3" /> : <X className="size-3" />}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{c.criterion}</p>
                      {c.evidence ? (
                        <p className="mt-0.5 text-xs text-secondary">“{c.evidence}”</p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Next drills</CardTitle>
                <CardDescription>
                  Three sessions that target this report&apos;s weak spots
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {report.recommendedDrills.map((d) => (
                  <Link
                    key={d.scenarioId}
                    href={`/practice?scenario=${d.scenarioId}`}
                    className="block rounded-md border border-border p-3 transition-colors hover:bg-background-hover"
                  >
                    <p className="text-sm font-medium">
                      {titleCase(
                        d.scenarioId.replace(
                          /^(fluency|pron|daily|office|interview|present|debate|nego|travel|exam|social|story|free)-/,
                          "",
                        ),
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-secondary">{d.reason}</p>
                  </Link>
                ))}
                <Button asChild className="mt-2 w-full" prefix={<Mic />}>
                  <Link
                    href={
                      session.scenarioId ? `/practice?scenario=${session.scenarioId}` : "/practice"
                    }
                  >
                    Practice again
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* print-only transcript */}
      <div className="hidden print:block">
        <h2 className="mb-2 text-lg font-semibold">Transcript</h2>
        {utterances.map((u) => (
          <p key={u.id} className="text-sm">
            <b>{u.speaker === "human" ? "You" : session.personaName}:</b> {u.text}
          </p>
        ))}
      </div>
      <p className="text-xs text-tertiary print:hidden">
        Difficulty{" "}
        <Badge variant={DIFF_TONE[session.difficulty] ?? "gray"} size="sm">
          {session.difficulty}
        </Badge>{" "}
        · session id <span className="font-mono">{session.id}</span>
      </p>
      <Button
        variant="ghost"
        size="sm"
        prefix={<Download />}
        className="print:hidden"
        onClick={downloadTranscript}
      >
        Download transcript (.txt)
      </Button>
    </div>
  );
}

function Transcript({
  utterances,
  errors,
  events,
  personaName,
  activeMs,
  onSeek,
}: {
  utterances: ReportUtterance[];
  errors: AnalysisReport["grammarErrors"];
  events: ReportEvent[];
  personaName: string;
  activeMs: number;
  onSeek: (ms: number) => void;
}) {
  const hintTimes = events.filter((e) => e.type === "hint").map((e) => e.atMs);
  return (
    <div className="space-y-3">
      {utterances.map((u) => {
        const mine = u.speaker === "human";
        const active = activeMs > 0 && activeMs >= u.startMs && activeMs <= u.endMs;
        const hadHint = hintTimes.some((t) => t >= u.startMs - 2000 && t <= u.endMs + 2000);
        return (
          <div
            key={u.id}
            className={cn(
              "flex gap-3 rounded-md px-2 py-1.5 transition-colors",
              active && "bg-blue-100/60",
            )}
          >
            <button
              className="mt-1 w-12 shrink-0 text-left font-mono text-[11px] text-tertiary hover:text-foreground"
              onClick={() => onSeek(u.startMs)}
              aria-label="Seek to this line"
            >
              {formatDuration(u.startMs / 1000)}
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium tracking-wide text-tertiary uppercase">
                {mine ? "You" : (u.agentCharacter ?? personaName)}
                {u.interrupted ? " · interrupted" : ""}
                {hadHint && mine ? " · hint used" : ""}
              </p>
              <p className={cn("text-base leading-7", mine ? "text-foreground" : "text-secondary")}>
                {mine ? <HighlightedText text={u.text} words={u.words} errors={errors} /> : u.text}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HighlightedText({
  text,
  words,
  errors,
}: {
  text: string;
  words: ReportUtterance["words"];
  errors: AnalysisReport["grammarErrors"];
}) {
  // 1) error spans by quote match  2) low-confidence words by STT confidence
  const spans: { start: number; end: number; error: AnalysisReport["grammarErrors"][number] }[] =
    [];
  for (const e of errors) {
    const idx = text.toLowerCase().indexOf(e.quote.toLowerCase());
    if (idx >= 0 && !spans.some((s) => idx < s.end && idx + e.quote.length > s.start))
      spans.push({ start: idx, end: idx + e.quote.length, error: e });
  }
  spans.sort((a, b) => a.start - b.start);
  const lowConf = new Set(
    (words ?? [])
      .filter((w) => w.conf !== null && w.conf < 0.6)
      .map((w) => w.w.toLowerCase().replace(/[.,!?]/g, "")),
  );
  const renderPlain = (chunk: string, key: string) =>
    chunk.split(/(\s+)/).map((tok, i) => {
      const clean = tok.toLowerCase().replace(/[.,!?]/g, "");
      return clean && lowConf.has(clean) ? (
        <span
          key={`${key}-${i}`}
          className="underline decoration-amber-700 decoration-dotted underline-offset-4"
          title="Low transcription confidence — possibly unclear pronunciation"
        >
          {tok}
        </span>
      ) : (
        <span key={`${key}-${i}`}>{tok}</span>
      );
    });
  const out: React.ReactNode[] = [];
  let cursor = 0;
  spans.forEach((s, i) => {
    if (s.start > cursor) out.push(...renderPlain(text.slice(cursor, s.start), `p${i}`));
    out.push(
      <Popover key={`e${i}`}>
        <PopoverTrigger asChild>
          <button className="rounded-xs bg-red-100 px-0.5 text-red-900 underline decoration-red-700/70 underline-offset-4 hover:bg-red-200">
            {text.slice(s.start, s.end)}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 text-sm">
          <p className="text-xs font-medium tracking-wide text-tertiary uppercase">
            {titleCase(s.error.category)}
          </p>
          <p className="mt-1">
            <span className="line-through decoration-red-700/60">{s.error.quote}</span>
          </p>
          <p className="font-medium text-green-900">{s.error.correction}</p>
          <p className="mt-1 text-xs text-secondary">{s.error.explanation}</p>
        </PopoverContent>
      </Popover>,
    );
    cursor = s.end;
  });
  if (cursor < text.length) out.push(...renderPlain(text.slice(cursor), "tail"));
  return <>{out}</>;
}
