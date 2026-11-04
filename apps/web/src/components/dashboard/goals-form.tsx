"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TARGET_CEFR_OPTIONS, type TargetCefr } from "./goals-data";

export interface GoalsFormValues {
  weeklyMinutes: number | null;
  weeklySessions: number | null;
  targetCefr: TargetCefr | null;
  /** yyyy-mm-dd or "" */
  dueDate: string;
  remindByEmail: boolean;
}

const NONE = "none";

export function GoalsForm({
  initial,
  emailConfigured,
  ownerEmail,
}: {
  initial: GoalsFormValues;
  emailConfigured: boolean;
  ownerEmail: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState<GoalsFormValues>(initial);
  const [pending, setPending] = useState(false);
  const [testing, setTesting] = useState(false);

  const set = <K extends keyof GoalsFormValues>(key: K, v: GoalsFormValues[K]) =>
    setValues((s) => ({ ...s, [key]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    try {
      const remind = emailConfigured && values.remindByEmail;
      const dueDate = values.dueDate ? new Date(`${values.dueDate}T09:00:00`).toISOString() : null;
      const res = await fetch("/api/goals", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          goals: [
            { kind: "weekly_minutes", target: values.weeklyMinutes, remindByEmail: remind },
            { kind: "weekly_sessions", target: values.weeklySessions, remindByEmail: remind },
            {
              kind: "target_cefr",
              target: values.targetCefr ? 1 : null,
              targetCefr: values.targetCefr,
              dueDate,
              remindByEmail: remind,
            },
          ],
        }),
      });
      if (!res.ok) {
        toast.error("Couldn't save your goals");
        return;
      }
      toast.success("Goals saved");
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  const sendTest = async () => {
    setTesting(true);
    try {
      const res = await fetch("/api/goals/remind", { method: "POST" });
      const data = (await res.json()) as { error?: string; to?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't send the reminder");
        return;
      }
      toast.success(`Test reminder sent to ${data.to ?? ownerEmail}`);
    } finally {
      setTesting(false);
    }
  };

  const numberOrNull = (s: string) => {
    if (s.trim() === "") return null;
    const n = Number(s);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
  };

  return (
    <form onSubmit={save}>
      <Card>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="goal-minutes" hint="Speaking time that counts towards the week.">
              Weekly minutes
            </Label>
            <Input
              id="goal-minutes"
              type="number"
              inputMode="numeric"
              min={0}
              max={2000}
              placeholder="e.g. 60"
              value={values.weeklyMinutes ?? ""}
              onChange={(e) => set("weeklyMinutes", numberOrNull(e.target.value))}
              className="font-mono tabular"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="goal-sessions" hint="Completed sessions per week, any length.">
              Weekly sessions
            </Label>
            <Input
              id="goal-sessions"
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              placeholder="e.g. 4"
              value={values.weeklySessions ?? ""}
              onChange={(e) => set("weeklySessions", numberOrNull(e.target.value))}
              className="font-mono tabular"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="goal-cefr" hint="Where you want your overall CEFR band to be.">
              Target level
            </Label>
            <Select
              value={values.targetCefr ?? NONE}
              onValueChange={(v) => set("targetCefr", v === NONE ? null : (v as TargetCefr))}
            >
              <SelectTrigger id="goal-cefr">
                <SelectValue placeholder="Choose a level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>No target</SelectItem>
                {TARGET_CEFR_OPTIONS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="goal-date" hint="Optional. A date makes the level goal concrete.">
              By date
            </Label>
            <Input
              id="goal-date"
              type="date"
              value={values.dueDate}
              onChange={(e) => set("dueDate", e.target.value)}
              disabled={!values.targetCefr}
              className="font-mono tabular"
            />
          </div>
          <div className="flex items-start justify-between gap-4 rounded-md border border-border bg-background-100 p-4 sm:col-span-2">
            <Label
              htmlFor="goal-remind"
              hint={
                emailConfigured
                  ? `A short weekly nudge to ${ownerEmail} with your progress.`
                  : "Reminders need an email provider. Add RESEND_API_KEY and REMINDER_FROM_EMAIL to enable."
              }
            >
              Remind me by email
            </Label>
            <Switch
              id="goal-remind"
              checked={emailConfigured && values.remindByEmail}
              onCheckedChange={(v) => set("remindByEmail", v)}
              disabled={!emailConfigured}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            prefix={<Mail />}
            loading={testing}
            disabled={!emailConfigured}
            onClick={() => void sendTest()}
          >
            Send a test reminder
          </Button>
          <Button type="submit" loading={pending} prefix={<Save />}>
            Save goals
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
