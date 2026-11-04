"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { COACHING_MODE_INFO, type CoachingModeKey } from "@fluent/shared";
import { Badge, StatusBadge, type StatusKey } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatDate, formatDuration } from "@/lib/utils";

export interface SessionRow {
  id: string;
  scenarioTitle: string;
  themeSlug: string;
  coachingMode: string;
  difficulty: string;
  status: string;
  createdAt: string;
  startedAt: string | null;
  durationSec: number | null;
  overall: number | null;
  cefr: string | null;
}

export function SessionsTable({
  rows,
  themes,
}: {
  rows: SessionRow[];
  themes: { slug: string; title: string }[];
}) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [theme, setTheme] = useState("all");

  const data = useMemo(
    () =>
      rows.filter(
        (r) =>
          (status === "all" || r.status === status) &&
          (theme === "all" || r.themeSlug === theme) &&
          (!query || r.scenarioTitle.toLowerCase().includes(query.toLowerCase())),
      ),
    [rows, status, theme, query],
  );

  const columns = useMemo<ColumnDef<SessionRow>[]>(
    () => [
      {
        accessorKey: "createdAt",
        header: "Date",
        cell: ({ getValue }) => (
          <span className="font-mono text-secondary">
            {formatDate(getValue<string>(), { year: undefined })}
          </span>
        ),
        sortingFn: "datetime",
      },
      {
        accessorKey: "scenarioTitle",
        header: "Scenario",
        cell: ({ row }) => <span className="font-medium">{row.original.scenarioTitle}</span>,
      },
      {
        accessorKey: "coachingMode",
        header: "Mode",
        cell: ({ getValue }) => (
          <span className="text-secondary">
            {COACHING_MODE_INFO[getValue<string>() as CoachingModeKey]?.label ?? getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: "difficulty",
        header: "Level",
        cell: ({ getValue }) => (
          <Badge variant="outline" size="sm">
            {getValue<string>()}
          </Badge>
        ),
      },
      {
        accessorKey: "durationSec",
        header: "Duration",
        cell: ({ getValue }) => (
          <span className="font-mono text-secondary tabular">
            {formatDuration(getValue<number | null>())}
          </span>
        ),
      },
      {
        accessorKey: "overall",
        header: "Score",
        cell: ({ getValue }) => {
          const v = getValue<number | null>();
          return v === null ? (
            <span className="text-tertiary">—</span>
          ) : (
            <span
              className={cn(
                "font-mono tabular",
                v >= 75 ? "text-green-900" : v >= 55 ? "text-foreground" : "text-amber-900",
              )}
            >
              {Math.round(v)}
            </span>
          );
        },
      },
      {
        accessorKey: "cefr",
        header: "CEFR",
        cell: ({ getValue }) =>
          getValue<string | null>() ? (
            <Badge variant="blue" size="sm">
              {getValue<string>()}
            </Badge>
          ) : (
            <span className="text-tertiary">—</span>
          ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => <StatusBadge status={getValue<string>() as StatusKey} />,
        enableSorting: false,
      },
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          prefix={<Search />}
          placeholder="Search scenarios…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger size="sm" className="sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {["complete", "analyzing", "failed", "live"].map((s) => (
              <SelectItem key={s} value={s}>
                {s[0]!.toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={theme} onValueChange={setTheme}>
          <SelectTrigger size="sm" className="sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All themes</SelectItem>
            {themes.map((t) => (
              <SelectItem key={t.slug} value={t.slug}>
                {t.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto font-mono text-xs text-tertiary">{data.length} sessions</span>
      </div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((h) => (
                <TableHead key={h.id}>
                  {h.column.getCanSort() ? (
                    <button
                      className="inline-flex items-center gap-1 hover:text-foreground"
                      onClick={h.column.getToggleSortingHandler()}
                    >
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {h.column.getIsSorted() === "asc" ? (
                        <ArrowUp className="size-3" />
                      ) : h.column.getIsSorted() === "desc" ? (
                        <ArrowDown className="size-3" />
                      ) : (
                        <ArrowUpDown className="size-3 opacity-50" />
                      )}
                    </button>
                  ) : (
                    flexRender(h.column.columnDef.header, h.getContext())
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-10 text-center text-secondary">
                No sessions match these filters.
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                interactive
                onClick={() => router.push(`/sessions/${row.original.id}`)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between text-xs text-secondary">
        <span>
          Page <span className="font-mono">{table.getState().pagination.pageIndex + 1}</span> of{" "}
          <span className="font-mono">{Math.max(1, table.getPageCount())}</span>
        </span>
        <div className="flex gap-1">
          <Button
            size="iconSm"
            variant="secondary"
            aria-label="Previous page"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            <ChevronLeft />
          </Button>
          <Button
            size="iconSm"
            variant="secondary"
            aria-label="Next page"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
