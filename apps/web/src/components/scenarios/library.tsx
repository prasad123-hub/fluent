"use client";
import { useMemo, useState } from "react";
import { Heart, Plus, Search, SearchX, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { DIFFICULTIES, type DifficultyLevel } from "@fluent/shared";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Segmented } from "@/components/ui/segmented";
import { cn } from "@/lib/utils";
import { CustomScenarioDialog } from "./custom-scenario-dialog";
import { ScenarioCard } from "./scenario-card";
import { ScenarioSheet } from "./scenario-sheet";
import { ThemeIcon } from "./theme-icon";
import { CUSTOM_THEME_ID, type LibraryScenario, type LibraryTheme } from "./types";

type DifficultyFilter = DifficultyLevel | "all";

const ALL_THEME_ID = "all";

function ThemeChip({
  active,
  onClick,
  icon,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors duration-150",
        active
          ? "border-foreground bg-foreground text-inverse"
          : "border-border bg-background-100 text-secondary hover:border-border-hover hover:text-foreground",
      )}
    >
      {icon}
      {children}
      {count !== undefined ? (
        <span
          className={cn("font-mono text-xs tabular", active ? "text-inverse/70" : "text-tertiary")}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

function CreateCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-full min-h-36 flex-col items-start justify-between gap-3 rounded-lg border border-dashed border-border bg-background-200/40 p-4 text-left transition-colors duration-150 hover:border-border-hover hover:bg-background-hover"
    >
      <span className="flex size-8 items-center justify-center rounded-full border border-border bg-background-300 text-secondary transition-colors group-hover:text-foreground">
        <Plus className="size-4" strokeWidth={1.5} />
      </span>
      <span>
        <span className="block text-base font-medium tracking-tight">Create your own</span>
        <span className="mt-0.5 block text-sm text-secondary">
          Describe any situation in plain English and practise it in a minute.
        </span>
      </span>
    </button>
  );
}

export function ScenarioLibrary({
  themes,
  scenarios,
  customScenarios,
  favouriteIds,
  defaultDifficulty,
}: {
  themes: LibraryTheme[];
  scenarios: LibraryScenario[];
  customScenarios: LibraryScenario[];
  favouriteIds: string[];
  defaultDifficulty: DifficultyLevel;
}) {
  const [query, setQuery] = useState("");
  const [themeId, setThemeId] = useState<string>(ALL_THEME_ID);
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");
  const [onlyFavourites, setOnlyFavourites] = useState(false);
  const [favourites, setFavourites] = useState<Set<string>>(() => new Set(favouriteIds));
  const [customs, setCustoms] = useState<LibraryScenario[]>(customScenarios);
  const [selected, setSelected] = useState<LibraryScenario | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const everything = useMemo(() => [...customs, ...scenarios], [customs, scenarios]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return everything.filter((s) => {
      if (themeId !== ALL_THEME_ID && s.themeId !== themeId) return false;
      if (difficulty !== "all" && s.difficulty !== difficulty) return false;
      if (onlyFavourites && !favourites.has(s.id)) return false;
      if (!q) return true;
      return [
        s.title,
        s.description,
        s.persona.name,
        s.persona.role,
        s.themeTitle,
        ...s.keyVocabulary,
        ...s.tags,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [everything, themeId, difficulty, onlyFavourites, favourites, query]);

  const browsing =
    themeId === ALL_THEME_ID && !query.trim() && difficulty === "all" && !onlyFavourites;
  const countByTheme = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of everything) m.set(s.themeId, (m.get(s.themeId) ?? 0) + 1);
    return m;
  }, [everything]);

  async function toggleFavourite(id: string) {
    const adding = !favourites.has(id);
    setFavourites((prev) => {
      const next = new Set(prev);
      if (adding) next.add(id);
      else next.delete(id);
      return next;
    });
    const res = await fetch(`/api/scenarios/${encodeURIComponent(id)}/favourite`, {
      method: adding ? "POST" : "DELETE",
    });
    if (!res.ok) {
      setFavourites((prev) => {
        const next = new Set(prev);
        if (adding) next.delete(id);
        else next.add(id);
        return next;
      });
      toast.error("Couldn't update favourites");
    }
  }

  function onCreated(scenario: LibraryScenario) {
    setCustoms((prev) => [scenario, ...prev]);
    setThemeId(ALL_THEME_ID);
    setQuery("");
    setDifficulty("all");
    setOnlyFavourites(false);
    setSelected(scenario);
  }

  const activeTheme = themes.find((t) => t.id === themeId);
  const sections: Array<{ theme: LibraryTheme | null; items: LibraryScenario[] }> = browsing
    ? [
        { theme: null, items: customs },
        ...themes.map((t) => ({ theme: t, items: scenarios.filter((s) => s.themeId === t.id) })),
      ]
    : [];

  const favouriteCount = everything.filter((s) => favourites.has(s.id)).length;

  return (
    <>
      <PageHeader
        title="Scenarios"
        description={`${scenarios.length} scenarios across ${themes.length} themes, plus anything you dream up yourself.`}
        actions={
          <Button prefix={<Wand2 />} onClick={() => setCreateOpen(true)}>
            Create your own
          </Button>
        }
      />

      <div className="sticky top-14 z-20 -mx-4 border-b border-border bg-background-100/85 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Input
            prefix={<Search />}
            placeholder="Search titles, personas, vocabulary…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search scenarios"
            className="lg:max-w-sm"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Segmented
              aria-label="Difficulty"
              size="sm"
              value={difficulty}
              onValueChange={setDifficulty}
              options={[
                { value: "all", label: "All levels" },
                ...DIFFICULTIES.map((d) => ({ value: d, label: d })),
              ]}
            />
            <Button
              variant={onlyFavourites ? "primary" : "secondary"}
              size="sm"
              aria-pressed={onlyFavourites}
              onClick={() => setOnlyFavourites((v) => !v)}
              prefix={
                <Heart
                  strokeWidth={1.5}
                  className={cn(!onlyFavourites && favouriteCount > 0 && "text-pink-700")}
                  fill={favouriteCount > 0 ? "currentColor" : "none"}
                />
              }
            >
              Favourites
              <span className="ml-1 font-mono text-xs tabular opacity-70">{favouriteCount}</span>
            </Button>
          </div>
        </div>
        <div className="-mx-4 mt-3 scrollbar-none flex gap-1.5 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
          <ThemeChip active={themeId === ALL_THEME_ID} onClick={() => setThemeId(ALL_THEME_ID)}>
            All themes
          </ThemeChip>
          <ThemeChip
            active={themeId === CUSTOM_THEME_ID}
            onClick={() => setThemeId(CUSTOM_THEME_ID)}
            icon={<Wand2 className="size-3.5" strokeWidth={1.5} />}
            count={customs.length}
          >
            My scenarios
          </ThemeChip>
          {themes.map((t) => (
            <ThemeChip
              key={t.id}
              active={themeId === t.id}
              onClick={() => setThemeId(t.id)}
              icon={<ThemeIcon name={t.icon} className="size-3.5" />}
              count={countByTheme.get(t.id) ?? 0}
            >
              {t.title}
            </ThemeChip>
          ))}
        </div>
      </div>

      <div className="mt-8 space-y-12">
        {browsing ? (
          sections.map(({ theme, items }) => (
            <section
              key={theme?.id ?? CUSTOM_THEME_ID}
              id={`theme-${theme?.slug ?? CUSTOM_THEME_ID}`}
              className="scroll-mt-40"
            >
              <div className="mb-4 flex items-end justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-background-300 text-secondary">
                    {theme ? (
                      <ThemeIcon name={theme.icon} />
                    ) : (
                      <Wand2 className="size-4" strokeWidth={1.5} />
                    )}
                  </span>
                  <div>
                    <h2 className="text-md font-semibold tracking-tight">
                      {theme?.title ?? "My scenarios"}{" "}
                      <span className="font-mono text-sm font-normal text-tertiary tabular">
                        {items.length}
                      </span>
                    </h2>
                    <p className="text-sm text-secondary">
                      {theme?.description ?? "Scenarios you generated from your own situations."}
                    </p>
                  </div>
                </div>
                {theme && items.length > 4 ? (
                  <Button variant="ghost" size="sm" onClick={() => setThemeId(theme.id)}>
                    View all
                  </Button>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {!theme ? <CreateCard onClick={() => setCreateOpen(true)} /> : null}
                {items.map((s) => (
                  <ScenarioCard
                    key={s.id}
                    scenario={s}
                    favourite={favourites.has(s.id)}
                    onOpen={setSelected}
                    onToggleFavourite={toggleFavourite}
                  />
                ))}
              </div>
            </section>
          ))
        ) : (
          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-md font-semibold tracking-tight">
                  {activeTheme?.title ??
                    (themeId === CUSTOM_THEME_ID
                      ? "My scenarios"
                      : onlyFavourites
                        ? "Favourites"
                        : "Results")}{" "}
                  <span className="font-mono text-sm font-normal text-tertiary tabular">
                    {filtered.length}
                  </span>
                </h2>
                {activeTheme ? (
                  <p className="text-sm text-secondary">{activeTheme.description}</p>
                ) : null}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setThemeId(ALL_THEME_ID);
                  setQuery("");
                  setDifficulty("all");
                  setOnlyFavourites(false);
                }}
              >
                Clear filters
              </Button>
            </div>
            {filtered.length ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {themeId === CUSTOM_THEME_ID && !query.trim() ? (
                  <CreateCard onClick={() => setCreateOpen(true)} />
                ) : null}
                {filtered.map((s) => (
                  <ScenarioCard
                    key={s.id}
                    scenario={s}
                    favourite={favourites.has(s.id)}
                    onOpen={setSelected}
                    onToggleFavourite={toggleFavourite}
                  />
                ))}
              </div>
            ) : themeId === CUSTOM_THEME_ID && !query.trim() ? (
              <EmptyState
                icon={Wand2}
                title="No custom scenarios yet"
                description="Describe a real situation from your week and Fluent will turn it into a full practice scenario."
                action={
                  <Button prefix={<Plus />} onClick={() => setCreateOpen(true)}>
                    Create your own
                  </Button>
                }
              />
            ) : onlyFavourites && !query.trim() ? (
              <EmptyState
                icon={Heart}
                title="No favourites yet"
                description="Tap the heart on any scenario to keep it here for quick access."
                action={
                  <Button variant="secondary" onClick={() => setOnlyFavourites(false)}>
                    Browse scenarios
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={SearchX}
                title="Nothing matches"
                description="Try a different word, another level, or create this scenario yourself."
                action={
                  <Button prefix={<Wand2 />} onClick={() => setCreateOpen(true)}>
                    Create “{query.trim().slice(0, 32) || "a scenario"}”
                  </Button>
                }
              />
            )}
          </section>
        )}
      </div>

      <ScenarioSheet
        scenario={selected}
        themeIcon={themes.find((t) => t.id === selected?.themeId)?.icon ?? "Wand2"}
        favourite={!!selected && favourites.has(selected.id)}
        onOpenChange={(open) => !open && setSelected(null)}
        onToggleFavourite={toggleFavourite}
      />

      <CustomScenarioDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultDifficulty={defaultDifficulty}
        onCreated={onCreated}
      />
    </>
  );
}
