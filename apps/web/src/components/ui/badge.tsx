import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium leading-4 whitespace-nowrap",
  {
    variants: {
      variant: {
        gray: "border-border bg-background-300 text-secondary",
        outline: "border-border bg-transparent text-foreground",
        blue: "border-blue-400 bg-blue-100 text-blue-900",
        green: "border-green-400 bg-green-100 text-green-900",
        amber: "border-amber-400 bg-amber-100 text-amber-900",
        red: "border-red-400 bg-red-100 text-red-900",
        purple: "border-purple-400 bg-purple-100 text-purple-900",
        teal: "border-teal-400 bg-teal-100 text-teal-900",
        pink: "border-pink-400 bg-pink-100 text-pink-900",
        inverse: "border-transparent bg-foreground text-inverse",
      },
      size: { sm: "px-1.5 text-[11px] leading-4", md: "px-2 text-xs", lg: "px-2.5 py-1 text-sm" },
    },
    defaultVariants: { variant: "gray", size: "md" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  dot?: boolean;
  pulse?: boolean;
}

export function Badge({ className, variant, size, dot, pulse, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot ? (
        <span className="relative flex size-1.5">
          {pulse ? (
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60" />
          ) : null}
          <span className="relative inline-flex size-1.5 rounded-full bg-current" />
        </span>
      ) : null}
      {children}
    </span>
  );
}

export type StatusKey = "starting" | "live" | "ended" | "analyzing" | "complete" | "failed";
const STATUS: Record<
  StatusKey,
  { label: string; variant: BadgeProps["variant"]; pulse?: boolean }
> = {
  starting: { label: "Starting", variant: "gray", pulse: true },
  live: { label: "Live", variant: "green", pulse: true },
  ended: { label: "Ended", variant: "gray" },
  analyzing: { label: "Analyzing", variant: "amber", pulse: true },
  complete: { label: "Complete", variant: "blue" },
  failed: { label: "Failed", variant: "red" },
};

export function StatusBadge({ status, className }: { status: StatusKey; className?: string }) {
  const s = STATUS[status];
  return (
    <Badge variant={s.variant} dot pulse={s.pulse} className={className}>
      {s.label}
    </Badge>
  );
}

export { badgeVariants };
