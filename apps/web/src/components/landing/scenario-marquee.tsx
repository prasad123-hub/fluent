import { ThemeIcon } from "@/components/scenarios/theme-icon";
import { SCENARIO_COUNT, THEME_COUNT, THEME_LIST } from "./content";

function Strip({ ariaHidden }: { ariaHidden?: boolean }) {
  return (
    <ul aria-hidden={ariaHidden} className="flex shrink-0 items-center gap-3 pr-3">
      {THEME_LIST.map((t) => (
        <li
          key={t.id}
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-border bg-background-200 px-4 text-sm whitespace-nowrap text-secondary"
        >
          <ThemeIcon name={t.icon} className="size-3.5 text-tertiary" />
          {t.title}
        </li>
      ))}
    </ul>
  );
}

export function ScenarioMarquee() {
  return (
    <section aria-label="Practice themes" className="border-y border-border bg-background-100">
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
        <p className="text-center font-mono text-xs text-tertiary">
          {SCENARIO_COUNT} scenarios across {THEME_COUNT} themes
        </p>
      </div>
      <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)] pb-6">
        <div className="flex w-max animate-marquee hover:[animation-play-state:paused] motion-reduce:animate-none">
          <Strip />
          <Strip ariaHidden />
        </div>
      </div>
    </section>
  );
}
