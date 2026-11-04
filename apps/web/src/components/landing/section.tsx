import { cn } from "@/lib/utils";

export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", className)}>{children}</div>;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {eyebrow ? (
        <p className="font-mono text-xs font-medium tracking-wide text-blue-900 uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="max-w-2xl text-2xl font-semibold tracking-[-0.03em] text-balance sm:text-3xl">
        {title}
      </h2>
      {description ? (
        <p className="max-w-xl text-md text-balance text-secondary">{description}</p>
      ) : null}
    </div>
  );
}
