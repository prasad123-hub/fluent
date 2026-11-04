import Link from "next/link";
import { ArrowRight, Mic } from "lucide-react";
import { Logo } from "@/components/shell/logo";
import { Button } from "@/components/ui/button";
import { Container } from "./section";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden border-t border-border">
      <div
        aria-hidden
        className="absolute inset-0 grid-dots [mask-image:radial-gradient(ellipse_50%_80%_at_50%_100%,black_20%,transparent_100%)]"
      />
      <div
        aria-hidden
        className="absolute bottom-[-260px] left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(121,40,202,0.22),transparent)] blur-2xl"
      />
      <Container className="relative flex flex-col items-center py-24 text-center sm:py-32">
        <h2 className="max-w-2xl text-3xl font-semibold tracking-[-0.04em] text-balance sm:text-4xl">
          Your next conversation starts now.
        </h2>
        <p className="mt-4 max-w-md text-md text-balance text-secondary">
          Ten minutes today, a clearer voice in the meeting tomorrow. No lobby, no scheduling, no
          one listening in.
        </p>
        <div className="mt-8 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/login">
              <Mic className="size-4" strokeWidth={1.5} /> Start practicing
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg" className="w-full sm:w-auto">
            <a href="#features">
              Explore features <ArrowRight className="size-4" strokeWidth={1.5} />
            </a>
          </Button>
        </div>
      </Container>
    </section>
  );
}

const FOOTER_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#report", label: "Reports" },
  { href: "#faq", label: "FAQ" },
  { href: "/login", label: "Log in" },
];

export function Footer() {
  return (
    <footer className="border-t border-border">
      <Container className="flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <Logo href="/" />
          <p className="text-sm text-secondary">Voice coaching for Indian English speakers.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
          {FOOTER_LINKS.map((l) =>
            l.href.startsWith("/") ? (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-secondary transition-colors hover:text-foreground"
              >
                {l.label}
              </Link>
            ) : (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-secondary transition-colors hover:text-foreground"
              >
                {l.label}
              </a>
            ),
          )}
        </nav>
      </Container>
      <Container className="flex flex-col gap-2 border-t border-border py-5 font-mono text-xs text-tertiary sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Fluent. Single-owner, self-hosted.</p>
        <p>Built on LiveKit · Styled after Geist</p>
      </Container>
    </footer>
  );
}
