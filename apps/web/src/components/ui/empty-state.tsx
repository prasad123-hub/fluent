import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background-200/50 text-center",
        compact ? "px-6 py-10" : "px-6 py-16",
        className,
      )}
    >
      {Icon ? (
        <div className="mb-4 flex size-10 items-center justify-center rounded-full border border-border bg-background-300">
          <Icon className="size-4 text-secondary" strokeWidth={1.5} />
        </div>
      ) : null}
      <h3 className="text-md font-semibold tracking-tight">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-sm text-secondary">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-red-500/40 bg-red-100/40 px-6 py-12 text-center",
        className,
      )}
    >
      <h3 className="text-md font-semibold tracking-tight">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-sm text-secondary">{description}</p> : null}
      {onRetry ? (
        <button
          onClick={onRetry}
          className="mt-5 h-8 rounded-sm border border-border bg-background-100 px-3 text-sm font-medium hover:bg-background-hover"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
