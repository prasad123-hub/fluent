"use client";
import Link from "next/link";
import { ArrowRight, Check, Clock, Heart, Mic, Quote, Target, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ThemeIcon } from "./theme-icon";
import { DIFFICULTY_TONE, MODE_LABEL, type LibraryScenario } from "./types";

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2.5">
      <h3 className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-tertiary uppercase">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

function Mistake({ text }: { text: string }) {
  const match = /^(.*?)\s*\(→\s*(.*?)\)\s*$/.exec(text);
  if (!match)
    return <li className="rounded-md border border-border bg-background-100 px-3 py-2">{text}</li>;
  return (
    <li className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-border bg-background-100 px-3 py-2">
      <span className="text-secondary line-through decoration-red-700/70">{match[1]}</span>
      <ArrowRight className="size-3 text-tertiary" strokeWidth={1.5} />
      <span className="font-medium text-green-900">{match[2]}</span>
    </li>
  );
}

export function ScenarioSheet({
  scenario,
  themeIcon,
  favourite,
  onOpenChange,
  onToggleFavourite,
}: {
  scenario: LibraryScenario | null;
  themeIcon: string;
  favourite: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleFavourite?: (id: string) => void;
}) {
  const initials = scenario?.persona.name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Sheet open={!!scenario} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        {scenario ? (
          <>
            <SheetHeader>
              <div className="mb-1 flex flex-wrap items-center gap-1.5">
                <Badge variant="gray" size="sm">
                  {scenario.custom ? (
                    <Wand2 className="size-3" strokeWidth={1.5} />
                  ) : (
                    <ThemeIcon name={themeIcon} className="size-3" />
                  )}
                  {scenario.themeTitle}
                </Badge>
                <Badge variant={DIFFICULTY_TONE[scenario.difficulty]} size="sm">
                  {scenario.difficulty}
                </Badge>
                <Badge variant="outline" size="sm">
                  {MODE_LABEL[scenario.mode] ?? scenario.mode}
                </Badge>
                <span className="inline-flex items-center gap-1 font-mono text-xs text-tertiary tabular">
                  <Clock className="size-3" strokeWidth={1.5} />~{scenario.suggestedDurationMin} min
                </span>
              </div>
              <SheetTitle className="text-balance">{scenario.title}</SheetTitle>
              <SheetDescription>{scenario.description}</SheetDescription>
            </SheetHeader>

            <SheetBody className="space-y-7">
              <div className="flex items-start gap-3 rounded-lg border border-border bg-background-100 p-3">
                <span
                  aria-hidden
                  className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-[linear-gradient(135deg,#0070f3,#7928ca)] text-xs font-medium text-white"
                >
                  {initials}
                </span>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-base font-medium">{scenario.persona.name}</p>
                  <p className="text-sm text-secondary">{scenario.persona.role}</p>
                  <p className="text-xs text-tertiary">
                    {scenario.persona.personality} · {scenario.persona.accent}
                  </p>
                </div>
              </div>

              <Section title="Opening line" icon={<Quote className="size-3" strokeWidth={1.5} />}>
                <p className="border-l-2 border-border pl-3 text-base text-foreground italic">
                  “{scenario.agentOpeningLine}”
                </p>
              </Section>

              <Section title="Your goal" icon={<Target className="size-3" strokeWidth={1.5} />}>
                <p className="text-base">{scenario.learnerGoal}</p>
              </Section>

              <Section title="Success criteria">
                <ul className="space-y-1.5">
                  {scenario.successCriteria.map((c) => (
                    <li key={c} className="flex items-start gap-2 text-sm">
                      <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-border bg-background-300">
                        <Check className="size-2.5 text-secondary" strokeWidth={2} />
                      </span>
                      {c}
                    </li>
                  ))}
                </ul>
              </Section>

              <Section title="Key vocabulary">
                <ul className="flex flex-wrap gap-1.5">
                  {scenario.keyVocabulary.map((w) => (
                    <li
                      key={w}
                      className="rounded-full border border-border bg-background-100 px-2.5 py-0.5 font-mono text-xs text-foreground"
                    >
                      {w}
                    </li>
                  ))}
                </ul>
              </Section>

              <Section title="Useful phrases">
                <ul className="divide-y divide-border rounded-md border border-border bg-background-100">
                  {scenario.usefulPhrases.map((p) => (
                    <li key={p} className="px-3 py-2 text-sm">
                      {p}
                    </li>
                  ))}
                </ul>
              </Section>

              <Section title="Common mistakes to watch">
                <ul className="space-y-1.5 text-sm">
                  {scenario.commonMistakesToWatch.map((m) => (
                    <Mistake key={m} text={m} />
                  ))}
                </ul>
              </Section>

              {scenario.custom && scenario.prompt ? (
                <Section title="Generated from">
                  <p className="text-sm text-secondary">“{scenario.prompt}”</p>
                </Section>
              ) : null}
            </SheetBody>

            <SheetFooter className="justify-between">
              {!scenario.custom && onToggleFavourite ? (
                <Button
                  variant="secondary"
                  aria-pressed={favourite}
                  onClick={() => onToggleFavourite(scenario.id)}
                  prefix={
                    <Heart
                      className={cn(favourite && "text-pink-700")}
                      strokeWidth={1.5}
                      fill={favourite ? "currentColor" : "none"}
                    />
                  }
                >
                  {favourite ? "Favourited" : "Favourite"}
                </Button>
              ) : (
                <span />
              )}
              <Button asChild>
                <Link href={`/practice?scenario=${encodeURIComponent(scenario.id)}`}>
                  <Mic className="size-4" /> Practice this
                </Link>
              </Button>
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
