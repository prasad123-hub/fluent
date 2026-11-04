"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { GrammarCategory } from "@prisma/client";
import { ArrowUpRight, Mic } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CATEGORY_LABELS, drillForCategory, practiceHref } from "@/components/dashboard/drills";

export interface MistakeRow {
  id: string;
  category: GrammarCategory;
  quote: string;
  correction: string;
  explanation: string;
  severity: number;
  date: string;
  sessionId: string;
  sessionTitle: string;
}

const SEVERITY: Record<number, { label: string; variant: "gray" | "amber" | "red" }> = {
  1: { label: "Minor", variant: "gray" },
  2: { label: "Moderate", variant: "amber" },
  3: { label: "Major", variant: "red" },
};

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors duration-150",
        active
          ? "border-foreground bg-foreground text-inverse"
          : "border-border bg-background-100 text-secondary hover:border-border-hover hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function MistakesTable({
  rows,
  categories,
}: {
  rows: MistakeRow[];
  categories: { category: GrammarCategory; count: number }[];
}) {
  const [filter, setFilter] = useState<GrammarCategory | "all">("all");
  const visible = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.category === filter)),
    [rows, filter],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>
          All
          <span className="font-mono text-xs tabular opacity-70">{rows.length}</span>
        </Chip>
        {categories.map((c) => (
          <Chip
            key={c.category}
            active={filter === c.category}
            onClick={() => setFilter(filter === c.category ? "all" : c.category)}
          >
            {CATEGORY_LABELS[c.category]}
            <span className="font-mono text-xs tabular opacity-70">{c.count}</span>
          </Chip>
        ))}
        {filter !== "all" ? (
          <Button asChild variant="secondary" size="sm" prefix={<Mic />} className="ml-auto">
            <Link href={practiceHref(drillForCategory(filter))}>
              Practice {CATEGORY_LABELS[filter].toLowerCase()}
            </Link>
          </Button>
        ) : null}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>You said</TableHead>
            <TableHead>Better</TableHead>
            <TableHead className="hidden lg:table-cell">Why</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead className="hidden sm:table-cell">Date</TableHead>
            <TableHead className="text-right">Session</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-secondary">
                Nothing in this category — nice.
              </TableCell>
            </TableRow>
          ) : (
            visible.map((r) => {
              const sev = SEVERITY[r.severity] ?? SEVERITY[1]!;
              return (
                <TableRow key={r.id} className="align-top">
                  <TableCell className="max-w-56 py-3">
                    <p className="text-foreground">&ldquo;{r.quote}&rdquo;</p>
                    <p className="mt-1 text-xs text-tertiary lg:hidden">{r.explanation}</p>
                  </TableCell>
                  <TableCell className="max-w-56 py-3 text-green-900">{r.correction}</TableCell>
                  <TableCell className="hidden max-w-72 py-3 text-secondary lg:table-cell">
                    {r.explanation}
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge variant={sev.variant} dot>
                      {sev.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden py-3 font-mono text-xs text-secondary tabular sm:table-cell">
                    {formatDate(r.date)}
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <Link
                      href={`/sessions/${r.sessionId}`}
                      className="inline-flex max-w-48 items-center gap-1 text-xs text-blue-700 hover:underline"
                      title={r.sessionTitle}
                    >
                      <span className="truncate">{r.sessionTitle}</span>
                      <ArrowUpRight className="size-3.5 shrink-0" />
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
