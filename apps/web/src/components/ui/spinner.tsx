import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn("relative inline-block size-4 shrink-0", className)}
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <span
          key={i}
          className="absolute top-0 left-1/2 h-[30%] w-[8%] -translate-x-1/2 rounded-full bg-current"
          style={{
            transform: `rotate(${i * 30}deg) translateY(0)`,
            transformOrigin: "50% 170%",
            animation: "spinner-fade 1.2s linear infinite",
            animationDelay: `${-1.2 + i * 0.1}s`,
            opacity: 0.25,
          }}
        />
      ))}
      <style>{`@keyframes spinner-fade{0%{opacity:1}100%{opacity:.15}}`}</style>
    </span>
  );
}
