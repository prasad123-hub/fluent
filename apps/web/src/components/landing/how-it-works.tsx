import { FileText, LibraryBig, Mic, type LucideIcon } from "lucide-react";
import { Container, SectionHeading } from "./section";

const STEPS: Array<{ icon: LucideIcon; title: string; description: string; meta: string }> = [
  {
    icon: LibraryBig,
    title: "Pick a scenario",
    description:
      "Choose from the library or describe your own situation in a sentence. Set the level, the coaching mode and how long you have.",
    meta: "30 seconds",
  },
  {
    icon: Mic,
    title: "Talk it through",
    description:
      "The coach greets you in character within two seconds. Interrupt, ask for a hint, ask them to slow down. Captions run underneath if you want them.",
    meta: "5–20 minutes",
  },
  {
    icon: FileText,
    title: "Read your report",
    description:
      "Scores on eight skills, every grammar slip with a correction, filler heatmap, pronunciation notes and the three things to practise next.",
    meta: "Ready in about a minute",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-14 border-t border-border py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="How it works"
          title="One button. Ten minutes. A better conversation tomorrow."
        />
        <ol className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex flex-col gap-4 bg-background-100 p-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-tertiary tabular">0{i + 1}</span>
                <span className="flex size-8 items-center justify-center rounded-md border border-border bg-background-300 text-secondary">
                  <step.icon className="size-4" strokeWidth={1.5} />
                </span>
              </div>
              <div>
                <h3 className="text-md font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-2 text-sm text-secondary">{step.description}</p>
              </div>
              <p className="mt-auto font-mono text-xs text-tertiary">{step.meta}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
