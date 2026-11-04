"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  href: string;
  label: string;
  exact?: boolean;
}

/** Vercel project-nav style tab bar with an animated sliding underline. */
export function TabBar({ items, className }: { items: TabItem[]; className?: string }) {
  const pathname = usePathname();
  const listRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);
  const [hover, setHover] = useState<{ left: number; width: number } | null>(null);

  const activeIndex = items.findIndex((t) =>
    t.exact ? pathname === t.href : pathname === t.href || pathname.startsWith(t.href + "/"),
  );

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const el = list.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    if (!el) {
      setIndicator(null);
      return;
    }
    const update = () => setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(list);
    return () => ro.disconnect();
  }, [activeIndex, items]);

  return (
    <nav aria-label="Sections" className={cn("relative border-b border-border", className)}>
      <div
        ref={listRef}
        className="relative -mb-px scrollbar-none flex items-stretch gap-0 overflow-x-auto px-2 sm:px-0"
        onMouseLeave={() => setHover(null)}
      >
        {hover ? (
          <span
            aria-hidden
            className="pointer-events-none absolute top-1.5 h-[calc(100%-12px)] rounded-sm bg-background-hover transition-all duration-150 ease-ds"
            style={{ left: hover.left, width: hover.width }}
          />
        ) : null}
        {items.map((t, i) => (
          <Link
            key={t.href}
            href={t.href}
            data-index={i}
            aria-current={i === activeIndex ? "page" : undefined}
            onMouseEnter={(e) =>
              setHover({ left: e.currentTarget.offsetLeft, width: e.currentTarget.offsetWidth })
            }
            className={cn(
              "relative z-10 flex h-11 shrink-0 items-center px-3 text-sm font-medium transition-colors duration-150",
              i === activeIndex ? "text-foreground" : "text-secondary hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        ))}
        {indicator ? (
          <span
            aria-hidden
            className="absolute bottom-0 h-0.5 rounded-full bg-foreground transition-all duration-200 ease-ds"
            style={{ left: indicator.left + 12, width: Math.max(0, indicator.width - 24) }}
          />
        ) : null}
      </div>
    </nav>
  );
}
