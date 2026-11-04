"use client";
import { useState } from "react";
import { Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { DIFFICULTIES, type DifficultyLevel } from "@fluent/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import { scenarioSchema } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { CUSTOM_THEME_ID, type LibraryScenario } from "./types";

const EXAMPLES = [
  "I'm meeting my CEO for the first time at an offsite",
  "Returning a laptop with a cracked screen to the store in Bengaluru",
  "Explaining a production outage to an unhappy client on a call",
  "Asking my landlord in Gurgaon to fix the water heater before winter",
];

const LEVEL_HINT: Record<DifficultyLevel, string> = {
  A2: "Simple, patient",
  B1: "Everyday pace",
  B2: "Pushes back",
  C1: "Demanding",
};

const MIN_PROMPT = 10;
const MAX_PROMPT = 500;

export function CustomScenarioDialog({
  open,
  onOpenChange,
  defaultDifficulty = "B1",
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDifficulty?: DifficultyLevel;
  onCreated: (scenario: LibraryScenario) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(defaultDifficulty);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = prompt.trim();
  const valid = trimmed.length >= MIN_PROMPT && trimmed.length <= MAX_PROMPT;

  async function submit() {
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/scenarios/custom", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: trimmed, difficulty }),
      });
      const body = (await res.json()) as {
        id?: string;
        prompt?: string;
        scenario?: unknown;
        createdAt?: string;
        source?: string;
        error?: string;
        issues?: Array<{ message: string }>;
      };
      if (!res.ok || !body.id)
        throw new Error(body.issues?.[0]?.message ?? body.error ?? "Could not create the scenario");
      const parsed = scenarioSchema.safeParse(body.scenario);
      if (!parsed.success) throw new Error("The generated scenario was incomplete. Try again.");
      const s = parsed.data;
      onCreated({
        id: body.id,
        themeId: CUSTOM_THEME_ID,
        themeTitle: "My scenarios",
        title: s.title,
        description: s.description,
        difficulty: s.difficulty,
        mode: s.mode,
        persona: s.agentPersona,
        agentOpeningLine: s.agentOpeningLine,
        learnerGoal: s.learnerGoal,
        successCriteria: s.successCriteria,
        keyVocabulary: s.keyVocabulary,
        usefulPhrases: s.usefulPhrases,
        commonMistakesToWatch: s.commonMistakesToWatch,
        suggestedDurationMin: s.suggestedDurationMin,
        tags: s.tags ?? ["custom"],
        custom: true,
        prompt: body.prompt ?? trimmed,
        createdAt: body.createdAt,
      });
      toast.success("Scenario ready", {
        description:
          body.source === "template"
            ? `“${s.title}” was built from a template — add an LLM key for richer scenarios.`
            : `“${s.title}” is saved under My scenarios.`,
      });
      setPrompt("");
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the scenario");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="size-4 text-purple-900" strokeWidth={1.5} />
            Create your own scenario
          </DialogTitle>
          <DialogDescription>
            Describe the situation and Fluent writes the character, goal, phrases and the mistakes
            to watch. It&apos;s saved to your library in a few seconds.
          </DialogDescription>
        </DialogHeader>

        <form
          className="mt-5 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="custom-prompt">Situation</Label>
            <Textarea
              id="custom-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe a situation in plain English… e.g. I'm meeting my CEO for the first time at an offsite"
              maxLength={MAX_PROMPT}
              rows={4}
              autoFocus
              disabled={submitting}
              aria-invalid={!!error || undefined}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") void submit();
              }}
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-tertiary">Press ⌘↵ to generate.</p>
              <p
                className={cn(
                  "font-mono text-xs tabular",
                  trimmed.length > MAX_PROMPT - 40 ? "text-amber-900" : "text-tertiary",
                )}
              >
                {trimmed.length}/{MAX_PROMPT}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-tertiary">Try one of these</p>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  disabled={submitting}
                  onClick={() => setPrompt(ex)}
                  className="rounded-full border border-border bg-background-100 px-2.5 py-1 text-left text-xs text-secondary transition-colors hover:border-border-hover hover:text-foreground"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label hint={LEVEL_HINT[difficulty]}>Difficulty</Label>
            <Segmented
              aria-label="Difficulty"
              value={difficulty}
              onValueChange={setDifficulty}
              options={DIFFICULTIES.map((d) => ({ value: d, label: d }))}
              className="w-full [&>button]:flex-1"
            />
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-md border border-red-500/50 bg-red-100 px-3 py-2 text-sm text-red-900"
            >
              {error}
            </p>
          ) : null}

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!valid} loading={submitting} prefix={<Sparkles />}>
              {submitting ? "Writing your scenario…" : "Generate scenario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
