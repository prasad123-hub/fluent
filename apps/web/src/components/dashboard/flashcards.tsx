"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Mic, RotateCcw, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusPill, type VocabItem } from "./vocab-shared";
import { practiceHref } from "./drills";

type Grade = 0 | 1 | 2 | 3;

const GRADES: { grade: Grade; label: string; hint: string; className: string }[] = [
  { grade: 0, label: "Again", hint: "Blanked", className: "text-red-900 hover:bg-red-100" },
  {
    grade: 1,
    label: "Hard",
    hint: "Got there slowly",
    className: "text-amber-900 hover:bg-amber-100",
  },
  { grade: 2, label: "Good", hint: "Knew it", className: "text-blue-900 hover:bg-blue-100" },
  { grade: 3, label: "Easy", hint: "Instant", className: "text-green-900 hover:bg-green-100" },
];

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const pick =
    voices.find((v) => v.lang === "en-IN") ??
    voices.find((v) => v.lang === "en-GB") ??
    voices.find((v) => v.lang.startsWith("en"));
  if (pick) u.voice = pick;
  u.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

export function Flashcards({
  open,
  onOpenChange,
  items,
  onReviewed,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  items: VocabItem[];
  onReviewed: (item: VocabItem) => void;
}) {
  // Build the queue once per opening so grading doesn't reshuffle the deck under the learner.
  const [queue, setQueue] = useState<VocabItem[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [pending, setPending] = useState(false);
  const [graded, setGraded] = useState<Record<Grade, number>>({ 0: 0, 1: 0, 2: 0, 3: 0 });

  useEffect(() => {
    if (!open) return;
    const now = Date.now();
    const sorted = [...items].sort((a, b) => {
      const ad = new Date(a.nextReviewAt).getTime() <= now ? 0 : 1;
      const bd = new Date(b.nextReviewAt).getTime() <= now ? 0 : 1;
      if (ad !== bd) return ad - bd;
      return new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime();
    });
    setQueue(sorted);
    setIndex(0);
    setFlipped(false);
    setGraded({ 0: 0, 1: 0, 2: 0, 3: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally snapshot on open only
  }, [open]);

  const current = queue[index];
  const dueCount = useMemo(() => {
    const now = Date.now();
    return queue.filter((q) => new Date(q.nextReviewAt).getTime() <= now).length;
  }, [queue]);
  const finished = queue.length > 0 && index >= queue.length;

  const grade = async (g: Grade) => {
    if (!current || pending) return;
    setPending(true);
    try {
      const res = await fetch("/api/vocab/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: current.id, grade: g }),
      });
      if (!res.ok) {
        toast.error("Couldn't save that review — try again");
        return;
      }
      const updated = (await res.json()) as VocabItem;
      onReviewed(updated);
      setGraded((s) => ({ ...s, [g]: s[g] + 1 }));
      setFlipped(false);
      setIndex((i) => i + 1);
    } finally {
      setPending(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      // A focused button already handles Space itself; only flip from "nowhere".
      if (e.key === " " && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (flipped && ["1", "2", "3", "4"].includes(e.key)) {
        void grade((Number(e.key) - 1) as Grade);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- grade closes over current/pending via state
  }, [open, flipped, current, pending]);

  const reviewed = Object.values(graded).reduce((a, b) => a + b, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Flashcards</DialogTitle>
          <DialogDescription>
            {dueCount > 0
              ? `${dueCount} due today, then the rest of your bank. Space flips, 1–4 grades.`
              : "Nothing is due yet — reviewing early still helps. Space flips, 1–4 grades."}
          </DialogDescription>
        </DialogHeader>

        {queue.length === 0 ? (
          <p className="py-10 text-center text-sm text-secondary">Add a word to start reviewing.</p>
        ) : finished ? (
          <div className="py-6 text-center">
            <p className="font-mono text-3xl font-medium tracking-tight tabular">{reviewed}</p>
            <p className="mt-1 text-sm text-secondary">
              cards reviewed — {graded[2] + graded[3]} you knew, {graded[0] + graded[1]} to see
              again soon.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button asChild prefix={<Mic />}>
                <Link href={practiceHref("fluency-vocabulary-upgrade")}>Use them in voice</Link>
              </Button>
              <Button
                variant="secondary"
                prefix={<RotateCcw />}
                onClick={() => {
                  setIndex(0);
                  setFlipped(false);
                }}
              >
                Go again
              </Button>
            </div>
          </div>
        ) : current ? (
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-3">
              <Progress value={index} max={queue.length} size="sm" className="flex-1" />
              <span className="font-mono text-xs text-secondary tabular">
                {index + 1} / {queue.length}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setFlipped((f) => !f)}
              className={cn(
                "flex min-h-56 w-full flex-col items-center justify-center rounded-lg border border-border bg-background-100 p-6 text-center transition-colors duration-150 hover:border-border-hover",
              )}
              aria-label={flipped ? "Show the word" : "Reveal the definition"}
            >
              {!flipped ? (
                <>
                  <span className="text-xs text-tertiary uppercase">Word</span>
                  <span className="mt-2 text-2xl font-semibold tracking-tight">{current.word}</span>
                  {current.partOfSpeech ? (
                    <span className="mt-1 text-sm text-secondary italic">
                      {current.partOfSpeech}
                    </span>
                  ) : null}
                  <span className="mt-6 text-xs text-tertiary">Tap to flip</span>
                </>
              ) : (
                <>
                  <span className="text-lg font-semibold tracking-tight">{current.word}</span>
                  {current.ipa ? (
                    <span className="mt-0.5 font-mono text-sm text-secondary">/{current.ipa}/</span>
                  ) : null}
                  <p className="mt-3 text-base text-foreground">{current.definition}</p>
                  <p className="mt-3 max-w-md text-sm text-secondary italic">
                    &ldquo;{current.example}&rdquo;
                  </p>
                </>
              )}
            </button>

            <div className="flex items-center justify-between gap-3">
              <StatusPill status={current.status} />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                prefix={<Volume2 />}
                onClick={() => speak(current.word)}
              >
                Hear it
              </Button>
            </div>

            {flipped ? (
              <div className="grid grid-cols-4 gap-2">
                {GRADES.map((g) => (
                  <button
                    key={g.grade}
                    type="button"
                    disabled={pending}
                    onClick={() => void grade(g.grade)}
                    className={cn(
                      "flex flex-col items-center rounded-sm border border-border bg-background-100 py-2.5 transition-colors duration-150 disabled:opacity-50",
                      g.className,
                    )}
                  >
                    <span className="text-sm font-medium">{g.label}</span>
                    <span className="text-[11px] text-tertiary">{g.hint}</span>
                  </button>
                ))}
              </div>
            ) : (
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => setFlipped(true)}
              >
                Show definition
              </Button>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
