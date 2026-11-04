import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "./card";

export function DeltaBadge({
  value,
  suffix = "",
  invert = false,
  className,
}: {
  value: number | null | undefined;
  suffix?: string;
  invert?: boolean;
  className?: string;
}) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  const good = invert ? value < 0 : value > 0;
  const neutral = Math.abs(value) < 0.05;
  const Icon = neutral ? Minus : value > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-mono text-xs tabular",
        neutral
          ? "bg-background-300 text-secondary"
          : good
            ? "bg-green-100 text-green-900"
            : "bg-red-100 text-red-900",
        className,
      )}
    >
      <Icon className="size-3" />
      {Math.abs(value).toFixed(Math.abs(value) >= 10 ? 0 : 1)}
      {suffix}
    </span>
  );
}

export function StatCard({
  label,
  value,
  unit,
  delta,
  deltaSuffix,
  invertDelta,
  hint,
  icon,
  className,
  children,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  delta?: number | null;
  deltaSuffix?: string;
  invertDelta?: boolean;
  hint?: string;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className={cn("flex flex-col gap-3 p-5", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-secondary">{label}</span>
        {icon ? <span className="text-tertiary [&_svg]:size-4">{icon}</span> : null}
      </div>
      <div className="flex items-end gap-2">
        <span className="font-mono text-2xl leading-none font-medium tracking-tight tabular">
          {value}
        </span>
        {unit ? <span className="pb-0.5 text-sm text-secondary">{unit}</span> : null}
        {delta !== undefined ? (
          <DeltaBadge
            value={delta}
            suffix={deltaSuffix}
            invert={invertDelta}
            className="mb-0.5 ml-auto"
          />
        ) : null}
      </div>
      {hint ? <p className="text-xs text-tertiary">{hint}</p> : null}
      {children}
    </Card>
  );
}
