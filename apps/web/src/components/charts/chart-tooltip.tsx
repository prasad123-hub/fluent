"use client";
import type { TooltipProps } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";

export interface ChartTooltipProps extends TooltipProps<ValueType, NameType> {
  unit?: string;
  format?: (v: number) => string;
  labelFormat?: (l: string | number) => string;
}

/** Vercel Analytics style tooltip card. */
export function ChartTooltip({
  active,
  payload,
  label,
  unit = "",
  format,
  labelFormat,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-background-200 px-3 py-2 text-xs shadow-menu">
      {label !== undefined ? (
        <p className="mb-1 text-tertiary">
          {labelFormat ? labelFormat(label as string) : String(label)}
        </p>
      ) : null}
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="flex items-center gap-2 font-mono tabular">
          <span
            className="inline-block size-2 rounded-full"
            style={{ background: (p.color as string) ?? "var(--ds-blue-700)" }}
          />
          <span className="text-secondary">{p.name}</span>
          <span className="ml-auto text-foreground">
            {format ? format(Number(p.value)) : `${Number(p.value).toLocaleString()}${unit}`}
          </span>
        </p>
      ))}
    </div>
  );
}

export const CHART = {
  accent: "var(--ds-blue-700)",
  accent2: "var(--ds-purple-700)",
  accent3: "var(--ds-teal-700)",
  mono: "var(--ds-gray-1000)",
  grid: "var(--ds-gray-300)",
  axis: "var(--ds-gray-600)",
  green: "var(--ds-green-700)",
  amber: "var(--ds-amber-700)",
  red: "var(--ds-red-700)",
} as const;

export const AXIS_TICK = {
  fontSize: 11,
  fill: "var(--ds-gray-700)",
  fontFamily: "var(--font-geist-mono)",
} as const;
