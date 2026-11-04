"use client";
import { useState } from "react";
import { ArrowRight, Check, Mic, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, DASHBOARD_TABS } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Segmented } from "@/components/ui/segmented";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { StatCard, DeltaBadge } from "@/components/ui/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip } from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { Kbd } from "@/components/ui/kbd";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PageHeader, SectionTitle } from "@/components/ui/page-header";

function Section({
  title,
  children,
  description,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <SectionTitle title={title} description={description} />
      <div className="rounded-lg border border-border bg-background-200 p-5">{children}</div>
    </section>
  );
}

const SWATCHES = ["gray", "blue", "green", "amber", "red", "teal", "purple", "pink"] as const;

export function DesignShowcase() {
  const [diff, setDiff] = useState<"A2" | "B1" | "B2" | "C1">("B1");
  const [on, setOn] = useState(true);

  return (
    <AppShell userName="Prasad" tabs={DASHBOARD_TABS}>
      <PageHeader
        title="Design system"
        description="Every Fluent primitive, in every state. Dev-only route for visual review."
        actions={<Button prefix={<Sparkles />}>Primary action</Button>}
      />
      <div className="space-y-10">
        <Section title="Colors" description="Geist scales 100–1000, tokens switch with the theme.">
          <div className="space-y-3">
            {SWATCHES.map((c) => (
              <div key={c} className="flex items-center gap-2">
                <span className="w-14 text-xs text-secondary">{c}</span>
                <div className="flex flex-1 gap-1">
                  {[100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].map((n) => (
                    <div
                      key={n}
                      className="h-7 flex-1 rounded-xs border border-border"
                      style={{ background: `var(--ds-${c}-${n})` }}
                      title={`${c}-${n}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Typography"
          description="Geist Sans for UI, Geist Mono for numbers, ids and code."
        >
          <div className="space-y-3">
            <p className="text-4xl font-semibold tracking-tight">Speak English like you mean it.</p>
            <p className="text-2xl font-semibold tracking-tight">Section heading 32px</p>
            <p className="text-xl font-semibold tracking-tight">Card title 24px</p>
            <p className="text-md">
              Body medium 16px — the quick brown fox jumps over the lazy dog.
            </p>
            <p className="text-base text-secondary">
              Body 14px secondary — the quick brown fox jumps over the lazy dog.
            </p>
            <p className="text-sm text-tertiary">Caption 13px tertiary</p>
            <p className="font-mono text-base tabular">
              mono 14px — 1,234.56 · sess_01HZX · 00:12:34
            </p>
          </div>
        </Section>

        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="tertiary">Tertiary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="accent">Accent</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outlineDestructive">Outline destructive</Button>
            <Button variant="link">Link</Button>
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
            <Button size="sm" prefix={<Plus />}>
              Small
            </Button>
            <Button size="lg" suffix={<ArrowRight />}>
              Large
            </Button>
            <Button size="icon" variant="secondary" aria-label="Mic">
              <Mic />
            </Button>
            <Button size="iconSm" variant="ghost" aria-label="Delete">
              <Trash2 />
            </Button>
          </div>
        </Section>

        <Section title="Badges & status">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Gray</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="blue">Blue</Badge>
            <Badge variant="green" dot>
              Green
            </Badge>
            <Badge variant="amber" dot>
              Amber
            </Badge>
            <Badge variant="red">Red</Badge>
            <Badge variant="purple">Purple</Badge>
            <Badge variant="teal">Teal</Badge>
            <Badge variant="pink">Pink</Badge>
            <Badge variant="inverse">Inverse</Badge>
            <StatusBadge status="starting" />
            <StatusBadge status="live" />
            <StatusBadge status="analyzing" />
            <StatusBadge status="complete" />
            <StatusBadge status="failed" />
            <DeltaBadge value={4.2} />
            <DeltaBadge value={-2.1} />
            <DeltaBadge value={0} />
            <DeltaBadge value={-1.5} invert suffix="%" />
            <Kbd>⌘K</Kbd>
            <Kbd>Esc</Kbd>
            <Avatar name="Prasad Narkhedkar" />
          </div>
        </Section>

        <Section title="Inputs">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="i1">Email</Label>
              <Input id="i1" placeholder="you@example.com" prefix={<Search />} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="i2" hint="Shown to the agent">
                Name
              </Label>
              <Input id="i2" defaultValue="Prasad" suffix={<Check />} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="i3">Invalid</Label>
              <Input id="i3" invalid defaultValue="not an email" />
              <p className="text-xs text-red-700">Enter a valid email address.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="i4">Disabled</Label>
              <Input id="i4" disabled placeholder="Disabled" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="t1">Textarea</Label>
              <Textarea id="t1" placeholder="Describe a situation in plain English…" />
            </div>
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Segmented
                value={diff}
                onValueChange={setDiff}
                options={[
                  { value: "A2", label: "A2" },
                  { value: "B1", label: "B1" },
                  { value: "B2", label: "B2" },
                  { value: "C1", label: "C1" },
                ]}
              />
            </div>
            <div className="space-y-2">
              <Label>Select</Label>
              <Select defaultValue="gentle">
                <SelectTrigger>
                  <SelectValue placeholder="Coaching mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immersive" description="Never breaks character">
                    Immersive
                  </SelectItem>
                  <SelectItem value="gentle" description="Natural recasts">
                    Gentle
                  </SelectItem>
                  <SelectItem value="active" description="One-line corrections">
                    Active coach
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <Label htmlFor="sw">Captions</Label>
              <Switch id="sw" checked={on} onCheckedChange={setOn} />
            </div>
            <div className="space-y-3">
              <Label>Speed</Label>
              <Slider defaultValue={[1]} min={0.7} max={1.3} step={0.05} />
            </div>
          </div>
        </Section>

        <Section title="Cards & stats">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Overall score" value="74" delta={4.2} hint="vs last 5 sessions" />
            <StatCard label="CEFR" value="B2" hint="Upper intermediate" />
            <StatCard label="Streak" value="6" unit="days" delta={1} />
            <StatCard
              label="Fillers / 100 words"
              value="3.1"
              delta={-0.8}
              invertDelta
              hint="lower is better"
            />
          </div>
          <Card className="mt-4">
            <CardHeader
              action={
                <Button size="sm" variant="secondary">
                  Action
                </Button>
              }
            >
              <CardTitle>Card title</CardTitle>
              <CardDescription>
                Hairline border, no shadow, header row with a right-aligned action.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={64} />
            </CardContent>
            <CardFooter>
              <span>Updated 2m ago</span>
              <Button variant="link" size="sm">
                Learn more
              </Button>
            </CardFooter>
          </Card>
        </Section>

        <Section title="Table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Scenario</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                ["4 Nov", "HR screening interview", "78", "complete"],
                ["3 Nov", "Daily stand-up update", "71", "complete"],
                ["2 Nov", "At the restaurant", "—", "analyzing"],
              ].map((r) => (
                <TableRow key={r[0]} interactive>
                  <TableCell className="font-mono text-secondary">{r[0]}</TableCell>
                  <TableCell>{r[1]}</TableCell>
                  <TableCell className="font-mono tabular">{r[2]}</TableCell>
                  <TableCell>
                    <StatusBadge status={r[3] as "complete"} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>

        <Section title="Overlays">
          <div className="flex flex-wrap gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary">Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>End this session?</DialogTitle>
                  <DialogDescription>
                    Your report will be ready in about a minute.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="secondary">Keep going</Button>
                  <Button>End session</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="secondary">Sheet</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Scenario details</SheetTitle>
                  <SheetDescription>Key phrases and goals</SheetDescription>
                </SheetHeader>
                <SheetBody>
                  <SkeletonText lines={5} />
                </SheetBody>
              </SheetContent>
            </Sheet>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="secondary">Popover</Button>
              </PopoverTrigger>
              <PopoverContent>
                <p className="text-sm">
                  I <span className="text-red-700 line-through">have went</span>{" "}
                  <span className="text-green-900">went</span> there yesterday.
                </p>
              </PopoverContent>
            </Popover>
            <Tooltip content="Tooltip content">
              <Button variant="secondary">Tooltip</Button>
            </Tooltip>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outlineDestructive">Alert dialog</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogTitle>Delete all data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes every session, report and vocabulary entry. It cannot be undone.
                </AlertDialogDescription>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction destructive>Delete everything</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              variant="secondary"
              onClick={() =>
                toast.success("Report ready", { description: "Your session scored 78." })
              }
            >
              Toast
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                toast.error("Microphone blocked", {
                  description: "Allow access in your browser settings.",
                })
              }
            >
              Error toast
            </Button>
          </div>
        </Section>

        <Section title="Tabs & accordion">
          <Tabs defaultValue="a">
            <TabsList>
              <TabsTrigger value="a">Transcript</TabsTrigger>
              <TabsTrigger value="b">Errors</TabsTrigger>
              <TabsTrigger value="c">Vocabulary</TabsTrigger>
            </TabsList>
            <TabsContent value="a">
              <p className="text-sm text-secondary">Transcript content.</p>
            </TabsContent>
            <TabsContent value="b">
              <p className="text-sm text-secondary">Errors content.</p>
            </TabsContent>
            <TabsContent value="c">
              <p className="text-sm text-secondary">Vocabulary content.</p>
            </TabsContent>
          </Tabs>
          <Accordion type="single" collapsible className="mt-6">
            <AccordionItem value="1">
              <AccordionTrigger>Does it understand Hinglish?</AccordionTrigger>
              <AccordionContent>
                Yes. It notices code-switching, gently nudges you back to English and counts it as a
                metric.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="2">
              <AccordionTrigger>How long is a session?</AccordionTrigger>
              <AccordionContent>5 to 20 minutes, or open-ended.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </Section>

        <Section title="States">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-3">
              <Skeleton className="h-6 w-1/2" />
              <SkeletonText />
              <Skeleton className="h-24" />
            </div>
            <EmptyState
              icon={Mic}
              title="No sessions yet"
              description="Start your first practice to see your dashboard come alive."
              action={<Button prefix={<Mic />}>Practice</Button>}
              compact
            />
            <ErrorState
              description="We couldn't load your report."
              onRetry={() => toast("Retrying…")}
            />
          </div>
        </Section>
      </div>
    </AppShell>
  );
}
