import { ArrowRight, Check, Circle } from "lucide-react";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";
import { Container, SectionHeading } from "./section";

const SAY_IT_BETTER: Array<{ said: string; better: string; category: string }> = [
  {
    said: "I am working here since three years.",
    better: "I've been working here for three years.",
    category: "Tense",
  },
  {
    said: "Can we prepone the release?",
    better: "Can we bring the release forward?",
    category: "Word choice",
  },
  {
    said: "Myself handling the client escalations.",
    better: "I handle the client escalations.",
    category: "Sentence form",
  },
];

const CRITERIA: Array<{ text: string; done: boolean }> = [
  { text: "States the dates clearly and gives a reason", done: true },
  { text: "Explains the handover plan", done: true },
  { text: "Asks the manager a question about coverage", done: true },
  { text: "Confirms the agreed next step before ending", done: false },
];

export function ReportPreview() {
  return (
    <section id="report" className="scroll-mt-14 border-t border-border py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="After every session"
          title="A report that shows you the evidence"
          description="Scores motivate, corrections are specific, and every priority links to a drill you can start right away."
        />

        <Card className="mt-12 overflow-hidden">
          <CardHeader
            className="flex-col gap-3 pb-5 sm:flex-row"
            action={
              <div className="flex items-center gap-2">
                <Badge variant="gray" size="sm">
                  Gentle
                </Badge>
                <StatusBadge status="complete" />
              </div>
            }
          >
            <CardDescription className="font-mono text-xs">
              Session report · 9 min 12 s · B2
            </CardDescription>
            <CardTitle className="text-lg">Asking a manager for leave</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 border-t border-border bg-background-100 pt-5">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard label="Overall" value="74" delta={3.2} hint="Up from 71 last session" />
              <StatCard label="CEFR estimate" value="B2" hint="Upper-intermediate, stable" />
              <StatCard
                label="Words per minute"
                value="128"
                delta={6}
                hint="Natural range: 120–150"
              />
              <StatCard
                label="Fillers per 100 words"
                value="2.1"
                delta={-0.8}
                invertDelta
                hint="Down from 2.9 — nice"
              />
            </div>

            <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
              <Card className="bg-background-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Say it better</CardTitle>
                  <CardDescription>Three lines from your transcript, rewritten.</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="divide-y divide-border rounded-md border border-border bg-background-100">
                    {SAY_IT_BETTER.map((row) => (
                      <li key={row.said} className="space-y-1 px-3 py-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm text-secondary line-through decoration-red-700/70">
                            {row.said}
                          </p>
                          <Badge variant="outline" size="sm" className="shrink-0">
                            {row.category}
                          </Badge>
                        </div>
                        <p className="flex items-start gap-1.5 text-sm text-foreground">
                          <ArrowRight
                            className="mt-1 size-3 shrink-0 text-green-900"
                            strokeWidth={1.5}
                          />
                          {row.better}
                        </p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-background-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Task criteria</CardTitle>
                  <CardDescription>3 of 4 achieved</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-2">
                    {CRITERIA.map((c) => (
                      <li key={c.text} className="flex items-start gap-2.5 text-sm">
                        <span
                          className={cn(
                            "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                            c.done
                              ? "border-green-700 bg-green-100 text-green-900"
                              : "border-border bg-background-300 text-tertiary",
                          )}
                        >
                          {c.done ? (
                            <Check className="size-2.5" strokeWidth={2.5} />
                          ) : (
                            <Circle className="size-2" strokeWidth={2} />
                          )}
                        </span>
                        <span className={cn(!c.done && "text-secondary")}>{c.text}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 rounded-md border border-blue-500/40 bg-blue-100 px-3 py-2 text-xs text-blue-900">
                    Next drill: <span className="font-medium">Present perfect for experience</span>{" "}
                    · 4 min
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </Container>
    </section>
  );
}
