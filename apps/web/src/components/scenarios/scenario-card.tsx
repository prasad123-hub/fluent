"use client";
import { Clock, Heart, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DIFFICULTY_TONE, MODE_LABEL, type LibraryScenario } from "./types";

export function ScenarioCard({
  scenario,
  favourite,
  onOpen,
  onToggleFavourite,
}: {
  scenario: LibraryScenario;
  favourite: boolean;
  onOpen: (scenario: LibraryScenario) => void;
  onToggleFavourite?: (id: string) => void;
}) {
  const canFavourite = !scenario.custom && !!onToggleFavourite;
  return (
    <div
      className={cn(
        "group relative flex h-full flex-col rounded-lg border border-border bg-background-200 transition-colors duration-150 hover:border-border-hover hover:bg-background-hover",
        "has-[button[data-open]:focus-visible]:outline-2 has-[button[data-open]:focus-visible]:outline-offset-2 has-[button[data-open]:focus-visible]:outline-blue-700",
      )}
    >
      <button
        type="button"
        data-open
        onClick={() => onOpen(scenario)}
        className="flex flex-1 flex-col items-start gap-2 p-4 text-left outline-none"
        aria-label={`Open ${scenario.title}`}
      >
        <div className="flex w-full items-start justify-between gap-3 pr-7">
          <span className="line-clamp-2 text-base leading-5 font-medium tracking-tight">
            {scenario.title}
          </span>
        </div>
        <p className="line-clamp-2 text-sm text-secondary">{scenario.description}</p>
        <div className="mt-auto flex w-full flex-wrap items-center gap-1.5 pt-1">
          <Badge variant={DIFFICULTY_TONE[scenario.difficulty]} size="sm">
            {scenario.difficulty}
          </Badge>
          <Badge variant="outline" size="sm">
            {MODE_LABEL[scenario.mode] ?? scenario.mode}
          </Badge>
          {scenario.custom ? (
            <Badge variant="purple" size="sm">
              <Wand2 className="size-3" strokeWidth={1.5} /> Custom
            </Badge>
          ) : null}
          <span className="ml-auto inline-flex items-center gap-1 font-mono text-xs text-tertiary tabular">
            <Clock className="size-3" strokeWidth={1.5} />
            {scenario.suggestedDurationMin}m
          </span>
        </div>
      </button>
      {canFavourite ? (
        <button
          type="button"
          aria-label={favourite ? "Remove from favourites" : "Add to favourites"}
          aria-pressed={favourite}
          onClick={() => onToggleFavourite(scenario.id)}
          className={cn(
            "absolute top-3 right-3 rounded-sm p-1 text-tertiary transition-colors hover:bg-background-300 hover:text-foreground",
            favourite && "text-pink-700 hover:text-pink-700",
          )}
        >
          <Heart className="size-4" strokeWidth={1.5} fill={favourite ? "currentColor" : "none"} />
        </button>
      ) : null}
    </div>
  );
}
