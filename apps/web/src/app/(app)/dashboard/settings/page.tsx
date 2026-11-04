import { requireOwnerPage } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { emailConfigured, env, recordingsConfigured } from "@/lib/env";
import { formatMinutes, round } from "@/lib/utils";
import {
  COACHING_MODES,
  DIFFICULTIES,
  type CoachingModeKey,
  type DifficultyLevel,
} from "@fluent/shared";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SettingsForm, type SettingsValues } from "@/components/dashboard/settings-form";
import {
  FIRST_LANGUAGES,
  THEME_CHOICES,
  type ThemeChoice,
} from "@/components/dashboard/settings-data";
import { DataCard } from "@/components/dashboard/data-card";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

const usd = (n: number) => (n < 0.01 && n > 0 ? "<$0.01" : `$${n.toFixed(n >= 10 ? 0 : 2)}`);

export default async function SettingsPage() {
  const owner = await requireOwnerPage();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [settings, scenarios, usage, sessionCount, vocabCount] = await Promise.all([
    prisma.userSettings.upsert({
      where: { userId: owner.id },
      update: {},
      create: { userId: owner.id },
    }),
    prisma.scenario.findMany({
      select: { id: true, title: true, theme: { select: { title: true, order: true } } },
      orderBy: [{ theme: { order: "asc" } }, { order: "asc" }],
    }),
    prisma.usageLog.groupBy({
      by: ["provider", "kind"],
      where: { createdAt: { gte: monthStart } },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        characters: true,
        audioSeconds: true,
        estimatedCostUsd: true,
      },
      orderBy: [{ provider: "asc" }, { kind: "asc" }],
    }),
    prisma.session.count({ where: { userId: owner.id } }),
    prisma.vocabEntry.count({ where: { userId: owner.id } }),
  ]);

  const initial: SettingsValues = {
    name: owner.name,
    firstLanguage: (FIRST_LANGUAGES as readonly string[]).includes(settings.firstLanguage)
      ? settings.firstLanguage
      : "Other",
    defaultScenarioId: settings.defaultScenarioId,
    defaultMode: (COACHING_MODES as readonly string[]).includes(settings.defaultMode)
      ? (settings.defaultMode as CoachingModeKey)
      : "gentle",
    defaultDifficulty: (DIFFICULTIES as readonly string[]).includes(settings.defaultDifficulty)
      ? (settings.defaultDifficulty as DifficultyLevel)
      : "B1",
    defaultVoice: settings.defaultVoice,
    defaultSpeed: settings.defaultSpeed,
    defaultDurationMin: settings.defaultDurationMin,
    captionsOn: settings.captionsOn,
    keyPhrasesOn: settings.keyPhrasesOn,
    pushToTalk: settings.pushToTalk,
    noiseSuppression: settings.noiseSuppression,
    recordSessions: settings.recordSessions,
    theme: (THEME_CHOICES as readonly string[]).includes(settings.theme)
      ? (settings.theme as ThemeChoice)
      : "dark",
  };

  const totalCost = usage.reduce((a, u) => a + (u._sum.estimatedCostUsd ?? 0), 0);
  const monthLabel = monthStart.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <>
      <PageHeader
        title="Settings"
        description="Your profile, practice defaults and the data this app keeps for you."
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <SettingsForm
            initial={initial}
            scenarios={scenarios.map((s) => ({ id: s.id, title: s.title, theme: s.theme.title }))}
            recordingsConfigured={recordingsConfigured}
          />
        </div>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader
              action={
                <span className="font-mono text-lg font-medium tracking-tight tabular">
                  {usd(totalCost)}
                </span>
              }
            >
              <CardTitle>Usage &amp; cost</CardTitle>
              <CardDescription>{monthLabel} · estimated from provider rates.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {usage.length === 0 ? (
                <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-secondary">
                  No API usage logged this month yet. Your next session will show up here.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead className="text-right">Tokens</TableHead>
                      <TableHead className="hidden text-right sm:table-cell">Chars</TableHead>
                      <TableHead className="hidden text-right sm:table-cell">Audio</TableHead>
                      <TableHead className="text-right">Est.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usage.map((u) => {
                      const tokens = (u._sum.inputTokens ?? 0) + (u._sum.outputTokens ?? 0);
                      const audio = u._sum.audioSeconds ?? 0;
                      return (
                        <TableRow key={`${u.provider}-${u.kind}`}>
                          <TableCell>
                            <span className="font-medium">{u.provider}</span>
                            <Badge variant="gray" size="sm" className="ml-2">
                              {u.kind}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs tabular">
                            {tokens ? tokens.toLocaleString("en-IN") : "—"}
                          </TableCell>
                          <TableCell className="hidden text-right font-mono text-xs tabular sm:table-cell">
                            {u._sum.characters ? u._sum.characters.toLocaleString("en-IN") : "—"}
                          </TableCell>
                          <TableCell className="hidden text-right font-mono text-xs tabular sm:table-cell">
                            {audio ? formatMinutes(round(audio / 60, 1)) : "—"}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs tabular">
                            {usd(u._sum.estimatedCostUsd ?? 0)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            <CardFooter>
              <span className="font-mono text-xs tabular">
                Max session {env.FLUENT_MAX_SESSION_MINUTES} min · Daily cap{" "}
                {env.FLUENT_MAX_DAILY_MINUTES} min
              </span>
              <span className="text-xs text-tertiary">
                {emailConfigured ? "Email reminders on" : "Email reminders off"}
              </span>
            </CardFooter>
          </Card>

          <DataCard sessionCount={sessionCount} vocabCount={vocabCount} />
        </div>
      </div>
    </>
  );
}
