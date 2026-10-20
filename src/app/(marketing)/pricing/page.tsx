import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, IndianRupee } from "lucide-react";

import { SectionHeading } from "@/components/marketing/section-heading";
import { AuroraBg } from "@/components/motion/aurora-bg";
import { GradientText } from "@/components/motion/gradient-text";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Hypothesis pricing for ScopePilot while we validate with freelancers and agencies.",
};

const tiers = [
  {
    name: "Free",
    price: "₹0",
    period: "",
    summary: "Try the full change-proposal workflow on a single workspace.",
    features: [
      "1 workspace owner",
      "Core scope + proposal features",
      "Client approval links",
      "Community support (best effort)",
    ],
  },
  {
    name: "Pro",
    price: "₹799",
    period: "/ month (hypothesis)",
    summary: "For established freelancers who send frequent change proposals.",
    features: [
      "Higher active project limits",
      "Proposal PDF export",
      "Email notifications",
      "Priority feature feedback channel",
    ],
    featured: true,
  },
  {
    name: "Agency",
    price: "₹1,999",
    period: "/ month (hypothesis)",
    summary: "For small agencies coordinating preparers and senders.",
    features: [
      "Multiple workspace members",
      "Role-based send permissions",
      "Audit export intent",
      "Shared templates (roadmap)",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="relative overflow-hidden py-16 sm:py-24">
      <AuroraBg variant="money" className="opacity-60" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <div className="mb-4 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-money/30 bg-money/10 px-3 py-1 text-xs font-semibold text-emerald-900">
              <IndianRupee className="size-3.5" />
              Money-clear pricing
            </span>
          </div>
          <SectionHeading
            eyebrow="Pricing"
            title="Honest numbers, clearly labeled"
            description="Everything below is a hypothesis for product discovery—not a binding quote. Early access users will receive direct notice before billing goes live."
          />
        </Reveal>
        <Stagger className="mt-14 grid gap-6 lg:grid-cols-3">
          {tiers.map((tier) => (
            <StaggerItem key={tier.name}>
              <div
                className={`flex h-full flex-col rounded-2xl border bg-card/90 p-6 backdrop-blur-sm transition-shadow hover:shadow-lift ${
                  tier.featured ? "gradient-border border-primary/40 shadow-glow ring-1 ring-primary/20" : ""
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="font-display text-xl font-bold">{tier.name}</h2>
                  {tier.featured ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                      Focus
                    </span>
                  ) : null}
                </div>
                <p className="mt-4 font-display text-4xl font-extrabold tracking-tight">
                  {tier.featured ? <GradientText>{tier.price}</GradientText> : tier.price}
                  {tier.period ? (
                    <span className="text-sm font-normal text-muted-foreground">{tier.period}</span>
                  ) : null}
                </p>
                <p className="mt-3 text-sm text-muted-foreground">{tier.summary}</p>
                <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                  {tier.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-money" aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className="mt-8 w-full" variant={tier.featured ? "default" : "outline"} asChild>
                  <Link href="/app">Open app</Link>
                </Button>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
        <p className="mt-10 text-center text-xs text-muted-foreground">
          Hypothesis only — talk to us before treating these as invoices.
        </p>
      </div>
    </div>
  );
}
