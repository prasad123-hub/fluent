"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { VocabStatus } from "@prisma/client";
import { BookOpen, Download, Layers, Mic, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatRelative } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Flashcards } from "./flashcards";
import { practiceHref } from "./drills";
import { StatusPill, type VocabItem } from "./vocab-shared";

export type { VocabItem } from "./vocab-shared";

const VOICE_DRILL = practiceHref("fluency-vocabulary-upgrade");

function isDue(item: VocabItem, now: number) {
  return new Date(item.nextReviewAt).getTime() <= now;
}

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCsv(items: VocabItem[]) {
  const esc = (v: string | number | null) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = [
    "word",
    "definition",
    "example",
    "ipa",
    "partOfSpeech",
    "status",
    "easeFactor",
    "intervalDays",
    "repetitions",
    "nextReviewAt",
    "createdAt",
  ];
  const lines = items.map((i) =>
    [
      i.word,
      i.definition,
      i.example,
      i.ipa,
      i.partOfSpeech,
      i.status,
      i.easeFactor,
      i.intervalDays,
      i.repetitions,
      i.nextReviewAt,
      i.createdAt,
    ]
      .map(esc)
      .join(","),
  );
  return [header.join(","), ...lines].join("\n");
}

type Filter = "all" | VocabStatus;

export function VocabularyBank({ initialItems }: { initialItems: VocabItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [flashOpen, setFlashOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<VocabItem | null>(null);

  const dueCutoff = endOfToday();
  const stats = useMemo(
    () => ({
      total: items.length,
      due: items.filter((i) => isDue(i, dueCutoff)).length,
      mastered: items.filter((i) => i.status === "mastered").length,
    }),
    [items, dueCutoff],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (i) =>
        (filter === "all" || i.status === filter) &&
        (!q || i.word.toLowerCase().includes(q) || i.definition.toLowerCase().includes(q)),
    );
  }, [items, query, filter]);

  const update = (next: VocabItem) =>
    setItems((xs) => xs.map((x) => (x.id === next.id ? next : x)));

  const remove = async (item: VocabItem) => {
    setPendingDelete(null);
    const res = await fetch(`/api/vocab/${item.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Couldn't remove that word");
      return;
    }
    setItems((xs) => xs.filter((x) => x.id !== item.id));
    toast.success(`Removed “${item.word}”`);
    router.refresh();
  };

  const header = (
    <PageHeader
      title="Vocabulary"
      description="Words you have used or met in sessions. Review them a little each day and they stick."
      actions={
        <>
          <Button variant="secondary" prefix={<Plus />} onClick={() => setAddOpen(true)}>
            Add word
          </Button>
          <Button prefix={<Layers />} onClick={() => setFlashOpen(true)} disabled={!items.length}>
            {stats.due > 0 ? `Review ${stats.due} due` : "Flashcards"}
          </Button>
        </>
      }
    />
  );

  if (items.length === 0) {
    return (
      <>
        {header}
        <EmptyState
          icon={BookOpen}
          title="Your word bank is empty"
          description="Every session adds the stronger words you used and a few you could try next. You can also add words by hand."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild prefix={<Mic />}>
                <Link href="/practice">Start practicing</Link>
              </Button>
              <Button variant="secondary" prefix={<Plus />} onClick={() => setAddOpen(true)}>
                Add a word
              </Button>
            </div>
          }
        />
        <AddWordDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          onAdded={(i) => {
            setItems((xs) => [i, ...xs]);
            router.refresh();
          }}
        />
      </>
    );
  }

  return (
    <>
      {header}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Words in bank"
          value={stats.total}
          icon={<BookOpen />}
          hint="Across all sessions and manual additions"
        />
        <StatCard
          label="Due today"
          value={stats.due}
          icon={<Layers />}
          hint={
            stats.due === 0
              ? "All caught up — come back tomorrow"
              : "A quick review keeps them fresh"
          }
        />
        <StatCard
          label="Mastered"
          value={stats.mastered}
          unit={`of ${stats.total}`}
          icon={<Mic />}
          hint="A word is mastered once its review interval passes 3 weeks"
        />
      </div>

      <div className="mt-6 rounded-lg border border-border bg-background-200 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Mic className="size-4 shrink-0 text-secondary" />
            <p className="text-sm text-secondary">
              <span className="font-medium text-foreground">Practice in voice.</span> The agent
              gives you plain sentences to upgrade using words from this bank.
            </p>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link href={VOICE_DRILL}>Practice in voice</Link>
          </Button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            prefix={<Search />}
            placeholder="Search words or definitions"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="sm:max-w-72"
            aria-label="Search vocabulary"
          />
          <Segmented<Filter>
            aria-label="Filter by status"
            value={filter}
            onValueChange={setFilter}
            options={[
              { value: "all", label: "All" },
              { value: "new", label: "New" },
              { value: "learning", label: "Learning" },
              { value: "mastered", label: "Mastered" },
            ]}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm" prefix={<Download />}>
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={() =>
                download(
                  "fluent-vocabulary.json",
                  JSON.stringify(items, null, 2),
                  "application/json",
                )
              }
            >
              JSON
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => download("fluent-vocabulary.csv", toCsv(items), "text/csv")}
            >
              CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Word</TableHead>
              <TableHead className="hidden md:table-cell">Definition</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Next review</TableHead>
              <TableHead className="hidden lg:table-cell">Added</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-secondary">
                  No words match that search.
                </TableCell>
              </TableRow>
            ) : (
              visible.map((i) => {
                const due = isDue(i, dueCutoff);
                return (
                  <TableRow key={i.id} className="align-top">
                    <TableCell className="py-3">
                      <p className="font-medium">{i.word}</p>
                      {i.ipa ? <p className="font-mono text-xs text-tertiary">/{i.ipa}/</p> : null}
                      <p className="mt-1 max-w-64 text-xs text-secondary md:hidden">
                        {i.definition}
                      </p>
                    </TableCell>
                    <TableCell className="hidden max-w-md py-3 md:table-cell">
                      <p className="text-secondary">{i.definition}</p>
                      <p className="mt-1 text-xs text-tertiary italic">{i.example}</p>
                    </TableCell>
                    <TableCell className="py-3">
                      <StatusPill status={i.status} />
                    </TableCell>
                    <TableCell className="hidden py-3 font-mono text-xs tabular sm:table-cell">
                      {due ? (
                        <span className="text-amber-900">Due now</span>
                      ) : (
                        <span className="text-secondary">{formatDate(i.nextReviewAt)}</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden py-3 font-mono text-xs text-secondary tabular lg:table-cell">
                      {formatRelative(i.createdAt)}
                    </TableCell>
                    <TableCell className="py-2 text-right">
                      <Button
                        variant="ghost"
                        size="iconSm"
                        aria-label={`Remove ${i.word}`}
                        onClick={() => setPendingDelete(i)}
                      >
                        <Trash2 />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <p className="mt-2 text-xs text-tertiary">
          Showing {visible.length} of {items.length}
        </p>
      </div>

      <Flashcards
        open={flashOpen}
        onOpenChange={setFlashOpen}
        items={items}
        onReviewed={(next) => {
          update(next);
          router.refresh();
        }}
      />

      <AddWordDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdded={(i) => {
          setItems((xs) => [i, ...xs]);
          router.refresh();
        }}
      />

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Remove “{pendingDelete?.word}”?</AlertDialogTitle>
          <AlertDialogDescription>
            It will drop out of your flashcards. Sessions that used it are unaffected.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              destructive
              onClick={() => pendingDelete && void remove(pendingDelete)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function AddWordDialog({
  open,
  onOpenChange,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onAdded: (item: VocabItem) => void;
}) {
  const [word, setWord] = useState("");
  const [definition, setDefinition] = useState("");
  const [example, setExample] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    try {
      const res = await fetch("/api/vocab", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ word, definition, example }),
      });
      const data = (await res.json()) as VocabItem | { error?: string };
      if (!res.ok) {
        toast.error("error" in data && data.error ? data.error : "Couldn't add that word");
        return;
      }
      onAdded(data as VocabItem);
      toast.success(`Added “${word.trim().toLowerCase()}” to your bank`);
      setWord("");
      setDefinition("");
      setExample("");
      onOpenChange(false);
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Add a word</DialogTitle>
            <DialogDescription>
              Write the example the way you would actually say it — that is what you will practise.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="vocab-word">Word or phrase</Label>
            <Input
              id="vocab-word"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="e.g. negotiable"
              required
              maxLength={60}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vocab-def">Definition</Label>
            <Textarea
              id="vocab-def"
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              placeholder="Open to discussion or change."
              required
              maxLength={500}
              className="min-h-20"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vocab-ex">Example sentence</Label>
            <Textarea
              id="vocab-ex"
              value={example}
              onChange={(e) => setExample(e.target.value)}
              placeholder="My joining date is negotiable, but I would prefer the first week of December."
              required
              maxLength={500}
              className="min-h-20"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={pending} prefix={<Plus />}>
              Add to bank
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
