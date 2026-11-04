"use client";
import * as React from "react";
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
  description?: string;
  disabled?: boolean;
}

/** Vercel-style segmented control (single select). */
export function Segmented<T extends string>({
  value,
  onValueChange,
  options,
  size = "md",
  className,
  "aria-label": ariaLabel,
}: {
  value: T;
  onValueChange: (v: T) => void;
  options: SegmentedOption<T>[];
  size?: "sm" | "md";
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={value}
      onValueChange={(v) => v && onValueChange(v as T)}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex w-fit max-w-full items-center gap-0.5 rounded-sm border border-border bg-background-300 p-0.5",
        className,
      )}
    >
      {options.map((o) => (
        <ToggleGroupPrimitive.Item
          key={o.value}
          value={o.value}
          disabled={o.disabled}
          title={o.description}
          className={cn(
            "rounded-xs px-3 font-medium text-secondary transition-colors duration-150 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-700 disabled:opacity-40 data-[state=on]:bg-background-100 data-[state=on]:text-foreground data-[state=on]:shadow-[0_0_0_1px_var(--ds-border)]",
            size === "md" ? "h-8 text-sm" : "h-7 px-2.5 text-xs",
          )}
        >
          {o.label}
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  );
}
