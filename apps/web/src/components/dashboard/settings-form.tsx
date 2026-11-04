"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Monitor, Moon, Save, Sun } from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Segmented } from "@/components/ui/segmented";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

import { FIRST_LANGUAGES, type ThemeChoice } from "./settings-data";

export type { ThemeChoice };

export interface SettingsValues {
  name: string;
  firstLanguage: string;
  defaultScenarioId: string | null;
  defaultMode: CoachingModeKey;
  defaultDifficulty: DifficultyLevel;
  defaultVoice: string;
  defaultSpeed: number;
  defaultDurationMin: number;
  captionsOn: boolean;
  keyPhrasesOn: boolean;
  pushToTalk: boolean;
  noiseSuppression: boolean;
  recordSessions: boolean;
  theme: ThemeChoice;
}

export interface ScenarioOption {
  id: string;
  title: string;
  theme: string;
}

const NONE = "none";

function ToggleRow({
  id,
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <Label htmlFor={id} hint={hint}>
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}

export function SettingsForm({
  initial,
  scenarios,
  recordingsConfigured,
}: {
  initial: SettingsValues;
  scenarios: ScenarioOption[];
  recordingsConfigured: boolean;
}) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [values, setValues] = useState<SettingsValues>(initial);
  const [saved, setSaved] = useState<SettingsValues>(initial);
  const [pending, setPending] = useState(false);

  const dirty = useMemo(() => JSON.stringify(values) !== JSON.stringify(saved), [values, saved]);
  const set = <K extends keyof SettingsValues>(key: K, v: SettingsValues[K]) =>
    setValues((s) => ({ ...s, [key]: v }));

  const grouped = useMemo(() => {
    const map = new Map<string, ScenarioOption[]>();
    for (const s of scenarios) map.set(s.theme, [...(map.get(s.theme) ?? []), s]);
    return [...map.entries()];
  }, [scenarios]);

  const changeTheme = (t: ThemeChoice) => {
    set("theme", t);
    setTheme(t);
    // Persist immediately so the choice survives on other devices; Save still covers everything.
    void fetch("/api/settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ theme: t }),
    }).then((r) => {
      if (r.ok) setSaved((s) => ({ ...s, theme: t }));
    });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...values,
          name: values.name.trim() || saved.name,
          recordSessions: recordingsConfigured && values.recordSessions,
        }),
      });
      if (!res.ok) {
        toast.error("Couldn't save settings");
        return;
      }
      setSaved(values);
      toast.success("Settings saved");
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            The coach uses your first language to spot patterns like “since three years”.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="s-name">Name</Label>
            <Input
              id="s-name"
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              maxLength={60}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-l1">First language</Label>
            <Select value={values.firstLanguage} onValueChange={(v) => set("firstLanguage", v)}>
              <SelectTrigger id="s-l1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIRST_LANGUAGES.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Practice defaults</CardTitle>
          <CardDescription>
            What the Practice button starts with. You can change any of these per session.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="s-scenario">Default scenario</Label>
            <Select
              value={values.defaultScenarioId ?? NONE}
              onValueChange={(v) => set("defaultScenarioId", v === NONE ? null : v)}
            >
              <SelectTrigger id="s-scenario">
                <SelectValue placeholder="Recommended for you" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Recommended for you</SelectItem>
                {grouped.map(([theme, list]) => (
                  <SelectGroup key={theme}>
                    <SelectLabel>{theme}</SelectLabel>
                    {list.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.title}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-mode">Coaching mode</Label>
            <Select
              value={values.defaultMode}
              onValueChange={(v) => set("defaultMode", v as CoachingModeKey)}
            >
              <SelectTrigger id="s-mode">
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
          <div className="space-y-1.5">
            <Label>Difficulty</Label>
            <Segmented<DifficultyLevel>
              aria-label="Difficulty"
              value={values.defaultDifficulty}
              onValueChange={(v) => set("defaultDifficulty", v)}
              options={DIFFICULTIES.map((d) => ({ value: d, label: d }))}
              className="mt-0.5"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-voice">Agent voice</Label>
            <Select value={values.defaultVoice} onValueChange={(v) => set("defaultVoice", v)}>
              <SelectTrigger id="s-voice">
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
          <div className="space-y-1.5">
            <Label htmlFor="s-length">Default length</Label>
            <Select
              value={String(values.defaultDurationMin)}
              onValueChange={(v) => set("defaultDurationMin", Number(v))}
            >
              <SelectTrigger id="s-length">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SESSION_LENGTHS_MIN.map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {m} minutes
                  </SelectItem>
                ))}
                <SelectItem value="0">Open-ended</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3 sm:col-span-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="s-speed" hint="Slower is easier to shadow; 1.0× is natural.">
                Speaking speed
              </Label>
              <span className="font-mono text-sm tabular">{values.defaultSpeed.toFixed(2)}×</span>
            </div>
            <Slider
              id="s-speed"
              min={0.7}
              max={1.3}
              step={0.05}
              value={[values.defaultSpeed]}
              onValueChange={([v]) => v !== undefined && set("defaultSpeed", v)}
              aria-label="Speaking speed"
            />
          </div>
          <div className="divide-y divide-border sm:col-span-2">
            <ToggleRow
              id="s-captions"
              label="Captions"
              hint="Show live captions during the session."
              checked={values.captionsOn}
              onChange={(v) => set("captionsOn", v)}
            />
            <ToggleRow
              id="s-phrases"
              label="Key phrases panel"
              hint="Keep the scenario's useful phrases open on the side."
              checked={values.keyPhrasesOn}
              onChange={(v) => set("keyPhrasesOn", v)}
            />
            <ToggleRow
              id="s-ptt"
              label="Push to talk"
              hint="Hold Space to speak instead of an always-open mic."
              checked={values.pushToTalk}
              onChange={(v) => set("pushToTalk", v)}
            />
            <ToggleRow
              id="s-noise"
              label="Noise suppression"
              hint="Filters fans and traffic before your voice reaches the agent."
              checked={values.noiseSuppression}
              onChange={(v) => set("noiseSuppression", v)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recording</CardTitle>
          <CardDescription>
            Keep the audio so you can replay it alongside the transcript.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ToggleRow
            id="s-record"
            label="Record sessions"
            hint={
              recordingsConfigured
                ? "Stored in your own S3-compatible bucket."
                : "Recording needs storage. Set RECORDINGS_ENABLED and the S3_* variables to turn this on."
            }
            checked={recordingsConfigured && values.recordSessions}
            onChange={(v) => set("recordSessions", v)}
            disabled={!recordingsConfigured}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Dark is the default. System follows your device.</CardDescription>
        </CardHeader>
        <CardContent>
          <Segmented<ThemeChoice>
            aria-label="Theme"
            value={values.theme}
            onValueChange={changeTheme}
            options={[
              {
                value: "dark",
                label: (
                  <span className="flex items-center gap-1.5">
                    <Moon className="size-3.5" /> Dark
                  </span>
                ),
              },
              {
                value: "light",
                label: (
                  <span className="flex items-center gap-1.5">
                    <Sun className="size-3.5" /> Light
                  </span>
                ),
              },
              {
                value: "system",
                label: (
                  <span className="flex items-center gap-1.5">
                    <Monitor className="size-3.5" /> System
                  </span>
                ),
              },
            ]}
          />
        </CardContent>
      </Card>

      <div className="sticky bottom-4 z-20 flex justify-end">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-background-200/90 p-2 pl-4 shadow-menu backdrop-blur">
          <span className="text-xs text-secondary">
            {dirty ? "Unsaved changes" : "All changes saved"}
          </span>
          <Button type="submit" loading={pending} disabled={!dirty} prefix={<Save />}>
            Save
          </Button>
        </div>
      </div>
    </form>
  );
}
