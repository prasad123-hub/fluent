import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { ScenarioMarquee } from "@/components/landing/scenario-marquee";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { ReportPreview } from "@/components/landing/report-preview";
import { MetricsBand } from "@/components/landing/metrics-band";
import { Faq } from "@/components/landing/faq";
import { FinalCta, Footer } from "@/components/landing/cta-footer";

export const metadata: Metadata = {
  title: { absolute: "Fluent — Speak English like you mean it" },
  description:
    "Real-time voice coaching for Indian English speakers. Role-play interviews, meetings and daily life with an AI coach, then get eight skills scored with evidence after every session.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Fluent — Speak English like you mean it",
    description:
      "Practise out loud with a voice coach that listens, nudges you live and scores eight skills after every session.",
    url: "/",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Fluent" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fluent — Speak English like you mean it",
    description:
      "Practise out loud with a voice coach that listens, nudges you live and scores eight skills after every session.",
  },
};

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background-100">
      <LandingNav />
      <main className="flex-1">
        <Hero />
        <ScenarioMarquee />
        <Features />
        <HowItWorks />
        <ReportPreview />
        <MetricsBand />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
