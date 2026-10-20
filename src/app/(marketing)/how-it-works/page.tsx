import type { Metadata } from "next";
import Link from "next/link";

import { ProposalPreview } from "@/components/marketing/proposal-preview";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "How it works",
  description: "Capture client requests, compare to scope, price the change, and get approval before work starts.",
};

const steps = [
  {
    n: "1",
    title: "Set your scope baseline",
    body: "Create a project and upload or enter what was sold—deliverables, exclusions, and the active scope version. This becomes the reference for every future request.",
  },
  {
    n: "2",
    title: "Capture the client request",
    body: "When a client asks for something new, log it in ScopePilot with the message, files, and urgency. Link it to the project so context stays intact.",
  },
  {
    n: "3",
    title: "Compare and summarize the gap",
    body: "ScopePilot highlights what falls outside the baseline. You refine the summary, effort estimate, and pricing model (fixed, hourly, or milestone).",
  },
  {
    n: "4",
    title: "Send the change proposal",
    body: "The client receives a structured proposal: original scope vs requested change, impact, and fee. They approve, decline, or ask for revisions from one link.",
  },
  {
    n: "5",
    title: "Execute with a clear record",
    body: "Approved work proceeds with a timestamped decision. Declined or revised proposals stay in the audit trail—useful for renewals, change orders, and invoices.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <SectionHeading
            eyebrow="How it works"
            title="From informal ask to approved change order"
            description="The same flow every time—whether the request arrives by email, call, or chat."
          />
        </Reveal>
        <div className="mt-14 grid gap-12 lg:grid-cols-2 lg:items-start">
          <Stagger className="space-y-6" stagger={0.1}>
            {steps.map((step) => (
              <StaggerItem key={step.n}>
                <li className="flex list-none gap-4 rounded-2xl border bg-card/80 p-4 transition-shadow hover:shadow-lift">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-teal-700 font-display text-sm font-bold text-primary-foreground shadow-glow">
                    {step.n}
                  </span>
                  <div>
                    <h2 className="font-display text-lg font-bold">{step.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                  </div>
                </li>
              </StaggerItem>
            ))}
          </Stagger>
          <Reveal delay={0.15} className="lg:sticky lg:top-24">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-pending">
              Example client view · pending
            </p>
            <ProposalPreview />
          </Reveal>
        </div>
        <Reveal className="mt-16 rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
          <h2 className="font-display text-xl font-bold">What happens on the client side?</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Clients open a secure link, review the side-by-side scope comparison, and choose an action.
            They do not need to learn your internal tools. If they request changes, you update the proposal
            and re-send—previous versions remain for reference.
          </p>
        </Reveal>
        <div className="mt-10">
          <Button size="lg" asChild>
            <Link href="/app">Open app</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
