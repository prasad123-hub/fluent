import Link from "next/link";
import { ArrowRight, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductMock } from "./product-mock";
import { Container } from "./section";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[720px] grid-dots [mask-image:radial-gradient(ellipse_60%_55%_at_50%_0%,black_30%,transparent_100%)]"
      />
      <div
        aria-hidden
        className="absolute top-[-200px] left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(0,112,243,0.18),transparent)] blur-2xl"
      />

      <Container className="relative flex flex-col items-center pt-20 pb-14 text-center sm:pt-28 sm:pb-16">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background-200 py-1 pr-3 pl-1.5 text-xs text-secondary">
          <span className="inline-flex items-center gap-1 rounded-full bg-background-300 px-1.5 py-0.5 font-medium text-foreground">
            <span className="size-1.5 rounded-full bg-green-700" />
            Live
          </span>
          <span className="sm:hidden">Voice</span>
          <span className="hidden sm:inline">Real-time voice</span> coaching for Indian English
          speakers
        </span>

        <h1 className="mt-6 max-w-4xl text-[44px] leading-[1.02] font-semibold tracking-[-0.04em] text-balance sm:text-4xl lg:text-[84px] lg:leading-[0.98]">
          Speak English like you mean it.
        </h1>
        <p className="mt-4 gradient-text text-lg font-medium tracking-tight text-balance sm:text-xl">
          Practise out loud. Get coached live. See exactly what to fix.
        </p>
        <p className="mt-5 max-w-xl text-md text-balance text-secondary">
          Role-play interviews, meetings, negotiations and everyday life with a voice coach that
          listens, nudges you in the moment, and scores eight skills after every session.
        </p>

        <div className="mt-8 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/login">
              <Mic className="size-4" strokeWidth={1.5} /> Start practicing
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg" className="w-full sm:w-auto">
            <a href="#how-it-works">
              See how it works <ArrowRight className="size-4" strokeWidth={1.5} />
            </a>
          </Button>
        </div>
        <p className="mt-4 font-mono text-xs text-tertiary">
          Ten minutes a day · No lobby, no scheduling · Works on your phone
        </p>
      </Container>

      <Container className="relative pb-8 sm:pb-16">
        <ProductMock className="mx-auto max-w-5xl animate-rise-in" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(to_top,var(--ds-background-100),transparent)]"
        />
      </Container>
    </section>
  );
}
