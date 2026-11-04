import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/dashboard",
  withWordmark = true,
}: {
  className?: string;
  href?: string;
  withWordmark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-2 rounded-sm", className)}
      aria-label="Fluent home"
    >
      <span className="relative flex size-6 items-center justify-center rounded-md border border-border bg-background-300">
        <span className="size-2.5 rounded-full border-[1.5px] border-foreground" />
        <span className="absolute size-1 rounded-full bg-blue-700" />
      </span>
      {withWordmark ? <span className="text-md font-semibold tracking-tight">Fluent</span> : null}
    </Link>
  );
}
