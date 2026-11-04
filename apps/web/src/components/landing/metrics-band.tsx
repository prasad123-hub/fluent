import { LATENCY_LABEL, SCENARIO_COUNT, SKILLS_TRACKED, THEME_COUNT } from "./content";
import { Container } from "./section";

const METRICS: Array<{ value: string; label: string }> = [
  { value: String(SKILLS_TRACKED), label: "skills tracked" },
  { value: LATENCY_LABEL, label: "turn latency" },
  { value: String(THEME_COUNT), label: "themes" },
  { value: String(SCENARIO_COUNT), label: "scenarios" },
];

export function MetricsBand() {
  return (
    <section aria-label="Fluent by the numbers" className="border-t border-border">
      <Container className="px-0 sm:px-6">
        <dl className="grid grid-cols-2 gap-px bg-border sm:my-10 sm:overflow-hidden sm:rounded-xl sm:border sm:border-border md:grid-cols-4">
          {METRICS.map((m) => (
            <div
              key={m.label}
              className="flex flex-col items-center bg-background-100 px-4 py-8 text-center sm:py-10"
            >
              <dt className="order-2 mt-1 text-sm text-secondary">{m.label}</dt>
              <dd className="order-1 font-mono text-2xl font-medium tracking-tight tabular sm:text-3xl">
                {m.value}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
