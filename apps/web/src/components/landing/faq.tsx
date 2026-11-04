import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQ } from "./content";
import { Container, SectionHeading } from "./section";

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-14 border-t border-border py-20 sm:py-28">
      <Container className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
        <SectionHeading
          align="left"
          eyebrow="FAQ"
          title="Questions people ask before their first session"
          description="Anything else? The Settings page explains every provider and toggle."
        />
        <Accordion type="single" collapsible className="rounded-xl border border-border px-5">
          {FAQ.map((item, i) => (
            <AccordionItem key={item.q} value={`faq-${i}`} className="last:border-b-0">
              <AccordionTrigger className="text-base sm:text-md">{item.q}</AccordionTrigger>
              <AccordionContent className="max-w-prose text-sm leading-6">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Container>
    </section>
  );
}
