import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/shell/logo";
import { Button } from "@/components/ui/button";
import { Container } from "./section";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#report", label: "Reports" },
  { href: "#faq", label: "FAQ" },
];

export function LandingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background-100/80 backdrop-blur-md">
      <Container className="flex h-14 items-center gap-6">
        <Logo href="/" />
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-sm px-2.5 py-1.5 text-sm text-secondary transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/login">
              Start practicing <ArrowRight className="size-3.5" strokeWidth={1.5} />
            </Link>
          </Button>
        </div>
      </Container>
    </header>
  );
}
