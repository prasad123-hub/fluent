"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Heart, Mic, Search, Sparkles, Star, Zap } from "lucide-react";
import { toast } from "sonner";
import {
  COACHING_MODES,
  COACHING_MODE_INFO,
  DIFFICULTIES,
  SESSION_LENGTHS_MIN,
  VOICES,
  type CoachingModeKey,
  type DifficultyLevel,
} from "@fluent/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/ui/page-header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Preflight } from "./preflight";
import { cn } from "@/lib/utils";

export interface LauncherScenario {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  mode: string;
  themeId: string;
  themeSlug: string;
  themeTitle: string;
  personaName: string;
  personaRole: string;
  suggestedDurationMin: number;
  tags: string[];
  custom: boolean;
}

export interface LauncherDefaults {
  difficulty: string;
  coachingMode: string;
  voice: string;
  speed: number;
  durationMin: number;
  captionsOn: boolean;
  keyPhrasesOn: boolean;
  preflightDone: boolean;
  micDeviceId: string | null;
  defaultScenarioId: string | null;
}

const DIFF_TONE: Record<string, "green" | "blue" | "purple" | "amber"> = {
  A2: "green",
  B1: "blue",
  B2: "purple",
  C1: "amber",
};

export function PracticeLauncher({
  themes,
  scenarios,
  recentIds,
  recommendedIds,
  favouriteIds,
  initialScenarioId,
  defaults,
}: {
  themes: { id: string; slug: string; title: string; icon: string }[];
  scenarios: LauncherScenario[];
  recentIds: string[];
  recommendedIds: string[];
  favouriteIds: string[];
  initialScenarioId: string | null;
  defaults: LauncherDefaults;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState<string>("all");
  const [diffFilter, setDiffFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(initialScenarioId);
  const [favs, setFavs] = useState<Set<string>>(new Set(favouriteIds));

  const [difficulty, setDifficulty] = useState<DifficultyLevel>(
    (defaults.difficulty as DifficultyLevel) ?? "B1",
  );
  const [mode, setMode] = useState<CoachingModeKey>(
    (defaults.coachingMode as CoachingModeKey) ?? "gentle",
  );
  const [voice, setVoice] = useState(defaults.voice);
  const [speed, setSpeed] = useState(defaults.speed);
  const [duration, setDuration] = useState<number>(defaults.durationMin);
  const [captions, setCaptions] = useState(defaults.captionsOn);
  const [keyPhrases, setKeyPhrases] = useState(defaults.keyPhrasesOn);
  const [starting, setStarting] = useState(false);
  const [preflightOpen, setPreflightOpen] = useState(false);

  const selected = scenarios.find((s) => s.id === selectedId) ?? null;

  useEffect(() => {
    if (selected)
      setDifficulty((d) => (defaults.difficulty ? d : (selected.difficulty as DifficultyLevel)));
  }, [selected, defaults.difficulty]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scenarios.filter((s) => {
      if (theme !== "all" && s.themeId !== theme) return false;
      if (diffFilter !== "all" && s.difficulty !== diffFilter) return false;
      if (
        q &&
        !`${s.title} ${s.description} ${s.personaName} ${s.themeTitle}`.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [scenarios, query, theme, diffFilter]);

  const byId = (ids: string[]) =>
    ids.map((id) => scenarios.find((s) => s.id === id)).filter((s): s is LauncherScenario => !!s);
  const recommended = byId(recommendedIds);
  const recent = byId(recentIds);
  const favourites = scenarios.filter((s) => favs.has(s.id));
  const quickStart =
    scenarios.find((s) => s.id === defaults.defaultScenarioId) ??
    recommended[0] ??
    scenarios[0] ??
    null;

  async function toggleFav(id: string) {
    const next = new Set(favs);
    const adding = !next.has(id);
    if (adding) next.add(id);
    else next.delete(id);
    setFavs(next);
    const res = await fetch(`/api/scenarios/${id}/favourite`, {
      method: adding ? "POST" : "DELETE",
    });
    if (!res.ok) {
      setFavs(favs);
      toast.error("Couldn't update favourites");
    }
  }

  async function start(overrides?: Partial<{ scenario: LauncherScenario }>) {
    const target = overrides?.scenario ?? selected;
    if (!target) return;
    if (!defaults.preflightDone && !sessionStorage.getItem("fluent.preflight")) {
      setSelectedId(target.id);
      setPreflightOpen(true);
      return;
    }
    setStarting(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          scenarioId: target.custom ? null : target.id,
          customScenarioId: target.custom ? target.id : null,
          difficulty,
          coachingMode: mode,
          voice,
          speed,
          durationMin: duration === 0 ? null : duration,
        }),
      });
      const body = (await res.json()) as {
        sessionId?: string;
        token?: string;
        livekitUrl?: string;
        error?: string;
      };
      if (!res.ok || !body.sessionId) throw new Error(body.error ?? "Could not start the session");
      sessionStorage.setItem(
        `fluent.session.${body.sessionId}`,
        JSON.stringify({
          token: body.token,
          url: body.livekitUrl,
          captions,
          keyPhrases,
          scenario: target.title,
          mode,
          difficulty,
          duration,
        }),
      );
      router.push(`/practice/${body.sessionId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start the session");
      setStarting(false);
    }
  }

  const ScenarioRow = ({ s, compact }: { s: LauncherScenario; compact?: boolean }) => (
    <button
      type="button"
      onClick={() => setSelectedId(s.id)}
      aria-pressed={selectedId === s.id}
      className={cn(
        "group flex w-full items-start gap-3 rounded-md border px-3 py-2.5 text-left transition-colors duration-150",
        selectedId === s.id
          ? "border-foreground/60 bg-background-300"
          : "border-border bg-background-200 hover:border-border-hover hover:bg-background-hover",
        compact && "max-w-[300px] min-w-[260px] shrink-0",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-base font-medium">{s.title}</span>
          <Badge variant={DIFF_TONE[s.difficulty] ?? "gray"} size="sm">
            {s.difficulty}
          </Badge>
        </div>
        <p
          className={cn("mt-0.5 text-sm text-secondary", compact ? "line-clamp-1" : "line-clamp-2")}
        >
          {s.description}
        </p>
        {!compact ? (
          <p className="mt-1 text-xs text-tertiary">
            {s.personaName} · {s.themeTitle} · ~{s.suggestedDurationMin} min
          </p>
        ) : null}
      </div>
      <span
        role="button"
        tabIndex={0}
        aria-label={favs.has(s.id) ? "Remove from favourites" : "Add to favourites"}
        onClick={(e) => {
          e.stopPropagation();
          void toggleFav(s.id);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            void toggleFav(s.id);
          }
        }}
        className={cn(
          "rounded-sm p-1 text-tertiary transition-colors hover:text-foreground",
          favs.has(s.id) && "text-pink-700 hover:text-pink-700",
        )}
      >
        <Heart className="size-4" fill={favs.has(s.id) ? "currentColor" : "none"} />
      </span>
    </button>
  );

  return (
    <>
      <PageHeader
        title="Practice"
        description="Pick a scenario, set the coaching mode, and you'll be talking in seconds."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left: picker */}
        <div className="min-w-0 space-y-6">
          {quickStart ? (
            <Card className="relative overflow-hidden border-blue-500/40 bg-[radial-gradient(ellipse_at_top_left,rgba(0,112,243,0.18),transparent_60%)]">
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-blue-900">
                    <Zap className="size-3.5" /> Quick start
                  </p>
                  <p className="mt-1 truncate text-md font-semibold tracking-tight">
                    {quickStart.title}
                  </p>
                  <p className="text-sm text-secondary">
                    {COACHING_MODE_INFO[mode].label} · {difficulty} ·{" "}
                    {duration ? `${duration} min` : "open"}
                  </p>
                </div>
                <Button
                  size="lg"
                  prefix={<Mic />}
                  loading={starting}
                  onClick={() => void start({ scenario: quickStart })}
                >
                  Start now
                </Button>
              </CardContent>
            </Card>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              prefix={<Search />}
              placeholder="Search scenarios…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="sm:max-w-xs"
            />
            <Segmented
              aria-label="Difficulty filter"
              value={diffFilter}
              onValueChange={setDiffFilter}
              size="sm"
              options={[
                { value: "all", label: "All levels" },
                ...DIFFICULTIES.map((d) => ({ value: d, label: d })),
              ]}
            />
          </div>
          <div className="-mx-1 flex scrollbar-none gap-1.5 overflow-x-auto px-1 pb-1">
            {[
              { id: "all", title: "All themes" },
              ...themes,
              ...(scenarios.some((s) => s.custom) ? [{ id: "custom", title: "My scenarios" }] : []),
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                aria-pressed={theme === t.id}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-sm transition-colors",
                  theme === t.id
                    ? "border-foreground bg-foreground text-inverse"
                    : "border-border text-secondary hover:border-border-hover hover:text-foreground",
                )}
              >
                {t.title}
              </button>
            ))}
          </div>

          {!query && theme === "all" && diffFilter === "all" ? (
            <>
              {recommended.length ? (
                <section>
                  <h2 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-secondary">
                    <Sparkles className="size-3.5" /> Recommended for you
                  </h2>
                  <div className="flex scrollbar-none gap-3 overflow-x-auto pb-1">
                    {recommended.map((s) => (
                      <ScenarioRow key={s.id} s={s} compact />
                    ))}
                  </div>
                </section>
              ) : null}
              {recent.length ? (
                <section>
                  <h2 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-secondary">
                    <Clock className="size-3.5" /> Recent
                  </h2>
                  <div className="flex scrollbar-none gap-3 overflow-x-auto pb-1">
                    {recent.map((s) => (
                      <ScenarioRow key={s.id} s={s} compact />
                    ))}
                  </div>
                </section>
              ) : null}
              {favourites.length ? (
                <section>
                  <h2 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-secondary">
                    <Star className="size-3.5" /> Favourites
                  </h2>
                  <div className="flex scrollbar-none gap-3 overflow-x-auto pb-1">
                    {favourites.map((s) => (
                      <ScenarioRow key={s.id} s={s} compact />
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          ) : null}

          <section>
            <h2 className="mb-2 text-sm font-medium text-secondary">
              {theme === "all"
                ? "All scenarios"
                : (themes.find((t) => t.id === theme)?.title ?? "My scenarios")}{" "}
              <span className="font-mono text-tertiary">({filtered.length})</span>
            </h2>
            {filtered.length ? (
              <div className="grid gap-2 md:grid-cols-2">
                {filtered.map((s) => (
                  <ScenarioRow key={s.id} s={s} />
                ))}
              </div>
            ) : (
              <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-secondary">
                No scenarios match. Try another search or theme.
              </p>
            )}
          </section>
        </div>

        {/* Right: config */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Session</CardTitle>
              <CardDescription>
                {selected
                  ? `${selected.title} · with ${selected.personaName}`
                  : "Choose a scenario on the left"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Segmented
                  aria-label="Difficulty"
                  value={difficulty}
                  onValueChange={setDifficulty}
                  options={DIFFICULTIES.map((d) => ({ value: d, label: d }))}
                  className="w-full [&>button]:flex-1"
                />
              </div>
              <div className="space-y-2">
                <Label>Coaching mode</Label>
                <Select value={mode} onValueChange={(v) => setMode(v as CoachingModeKey)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COACHING_MODES.map((m) => (
                      <SelectItem key={m} value={m} description={COACHING_MODE_INFO[m].description}>
                        {COACHING_MODE_INFO[m].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Voice</Label>
                  <Select value={voice} onValueChange={setVoice}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VOICES.map((v) => (
                        <SelectItem key={v.key} value={v.key} description={v.description}>
                          {v.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label hint={`${speed.toFixed(2)}×`}>Speed</Label>
                  <Slider
                    value={[speed]}
                    min={0.7}
                    max={1.3}
                    step={0.05}
                    onValueChange={(v) => setSpeed(v[0] ?? 1)}
                    className="mt-3"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Length</Label>
                <Segmented
                  aria-label="Session length"
                  value={String(duration)}
                  onValueChange={(v) => setDuration(Number(v))}
                  options={[
                    ...SESSION_LENGTHS_MIN.map((m) => ({ value: String(m), label: `${m}m` })),
                    { value: "0", label: "Open" },
                  ]}
                  className="w-full [&>button]:flex-1"
                />
              </div>
              <div className="divide-y divide-border rounded-md border border-border">
                <div className="flex items-center justify-between px-3 py-2.5">
                  <Label htmlFor="captions">Live captions</Label>
                  <Switch id="captions" checked={captions} onCheckedChange={setCaptions} />
                </div>
                <div className="flex items-center justify-between px-3 py-2.5">
                  <Label htmlFor="phrases">Key phrases sidebar</Label>
                  <Switch id="phrases" checked={keyPhrases} onCheckedChange={setKeyPhrases} />
                </div>
              </div>
              <Button
                size="lg"
                className="w-full"
                prefix={<Mic />}
                disabled={!selected}
                loading={starting}
                onClick={() => void start()}
              >
                Start practice
              </Button>
              <p className="text-center text-xs text-tertiary">
                Your defaults are remembered for next time.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={preflightOpen} onOpenChange={setPreflightOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Quick mic check</DialogTitle>
            <DialogDescription>
              Three seconds, once. Headphones help the agent hear only you.
            </DialogDescription>
          </DialogHeader>
          <Preflight
            onDone={(deviceId) => {
              sessionStorage.setItem("fluent.preflight", "1");
              if (deviceId) sessionStorage.setItem("fluent.micDeviceId", deviceId);
              void fetch("/api/settings", {
                method: "PUT",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ preflightDone: true, micDeviceId: deviceId ?? undefined }),
              });
              setPreflightOpen(false);
              void start();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
