import { cn } from "@/lib/utils";

/** Simple cell heatmap (e.g. filler words per minute). Values normalised to max. */
export function Heatmap({
  cells,
  labels,
  caption,
  className,
}: {
  cells: number[];
  labels?: string[];
  caption?: string;
  className?: string;
}) {
  const max = Math.max(1, ...cells);
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-1">
        {cells.map((v, i) => {
          const a = v / max;
          return (
            <div
              key={i}
              className="group relative h-8 flex-1 rounded-xs border border-border"
              style={{ background: `rgba(0,112,243,${0.08 + a * 0.75})` }}
              title={`${labels?.[i] ?? i}: ${v}`}
            >
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center font-mono text-[10px] text-foreground opacity-0 transition-opacity group-hover:opacity-100">
                {v}
              </span>
            </div>
          );
        })}
      </div>
      {labels ? (
        <div className="flex gap-1">
          {labels.map((l, i) => (
            <span
              key={i}
              className="flex-1 truncate text-center font-mono text-[10px] text-tertiary"
            >
              {l}
            </span>
          ))}
        </div>
      ) : null}
      {caption ? <p className="text-xs text-tertiary">{caption}</p> : null}
    </div>
  );
}
