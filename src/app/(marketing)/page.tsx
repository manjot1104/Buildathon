import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileSearch,
  GitCompare,
  IndianRupee,
  ShieldCheck,
  Stamp,
} from "lucide-react";

import { ProposalPreview } from "@/components/marketing/proposal-preview";
import { SectionHeading } from "@/components/marketing/section-heading";
import { AuroraBg } from "@/components/motion/aurora-bg";
import { BlurText } from "@/components/motion/blur-text";
import { GradientText } from "@/components/motion/gradient-text";
import { Magnet } from "@/components/motion/magnet";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { RotatingText } from "@/components/motion/rotating-text";
import { ShinyText } from "@/components/motion/shiny-text";
import { SpotlightCard } from "@/components/motion/spotlight-card";
import { Button } from "@/components/ui/button";

const faqs = [
  {
    q: "Is ScopePilot a project management tool?",
    a: "No. It focuses on scope boundaries: capturing client requests, comparing them to agreed scope, pricing the delta, and getting approval before you execute.",
  },
  {
    q: "Do clients need an account?",
    a: "Clients approve proposals through secure links. They do not need a full workspace login unless you invite team members on your side.",
  },
  {
    q: "What if the client says no?",
    a: "The proposal stays documented. You can revise pricing, descope the request, or close it—without ambiguity about what was offered.",
  },
  {
    q: "Can I export proposals?",
    a: "Yes. Proposals can be shared as links and exported to PDF for your records or procurement workflows.",
  },
  {
    q: "Is pricing on this page final?",
    a: "No. Free / Pro / Agency tiers shown here are hypotheses while we validate with early teams. Founding users will get clear notice before any paid plan ships.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero — brand-first, full-bleed atmosphere */}
      <section className="relative overflow-hidden border-b">
        <AuroraBg className="opacity-90" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,transparent_40%,hsl(var(--background))_85%)]"
        />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-28">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <span className="size-1.5 animate-pulse-soft rounded-full bg-primary" />
              <ShinyText>Scope change control</ShinyText>
            </p>
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-[3.4rem] lg:leading-[1.08]">
              <span className="block text-primary">ScopePilot</span>
              <BlurText
                className="mt-2"
                text="Stop doing extra work for free."
                as="span"
                delay={0.15}
              />
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Turn &ldquo;small tweaks&rdquo; into documented change proposals. Compare against
              agreed scope, price the impact, and get client{" "}
              <RotatingText
                className="font-semibold text-foreground"
                words={["approval", "clarity", "payment", "sign-off"]}
              />{" "}
              before you start.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Magnet>
                <Button size="lg" asChild>
                  <Link href="/app">
                    Open app
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </Magnet>
              <Button size="lg" variant="outline" asChild>
                <Link href="/how-it-works">See how it works</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              No credit card · Built for freelancers & agencies
            </p>
          </div>
          <Reveal delay={0.2} className="relative lg:pl-4" y={40}>
            <div
              aria-hidden
              className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/20 via-pending/10 to-transparent blur-2xl animate-float"
            />
            <ProposalPreview />
          </Reveal>
        </div>
      </section>

      {/* Problem */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <SectionHeading
              eyebrow="The problem"
              title="Scope creep is rarely malicious—it's unstructured."
              description="Email threads and chat messages aren't a contract. When requests pile up, teams absorb the cost or damage trust by billing surprises."
            />
          </Reveal>
          <Stagger className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              {
                title: "Informal asks",
                body: "Clients request changes in Slack or WhatsApp. Nothing ties the ask back to what was sold.",
                tone: "from-rose-500/10",
              },
              {
                title: "Invisible labor",
                body: "You deliver first and negotiate later. Margins erode on work that was never priced.",
                tone: "from-pending/15",
              },
              {
                title: "Approval gaps",
                body: "Without a clear approve / decline moment, both sides assume the other agreed.",
                tone: "from-primary/10",
              },
            ].map((item) => (
              <StaggerItem key={item.title}>
                <SpotlightCard className="h-full p-6">
                  <div
                    className={`mb-4 h-1 w-12 rounded-full bg-gradient-to-r ${item.tone} to-transparent`}
                  />
                  <h3 className="font-display text-xl font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </SpotlightCard>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="relative overflow-hidden border-y bg-ink py-20 text-ink-foreground sm:py-24">
        <AuroraBg variant="ink" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <SectionHeading
              light
              eyebrow="How it works"
              title="Four steps from request to approved change"
              description="A repeatable workflow your team and clients can follow every time scope shifts."
            />
          </Reveal>
          <Stagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: FileSearch,
                step: "Capture",
                text: "Log the client request with context, attachments, and project linkage.",
              },
              {
                icon: GitCompare,
                step: "Compare",
                text: "Contrast the ask against your baseline scope version and highlight gaps.",
              },
              {
                icon: IndianRupee,
                step: "Price",
                text: "Attach hours, fixed fees, or milestones so the delta is explicit.",
              },
              {
                icon: Stamp,
                step: "Approve",
                text: "Send a proposal link; record approve, decline, or revision in the audit trail.",
              },
            ].map(({ icon: Icon, step, text }, i) => (
              <StaggerItem key={step}>
                <div className="group relative h-full rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-colors hover:border-teal-400/40 hover:bg-white/10">
                  <span className="absolute right-4 top-4 font-display text-3xl font-bold text-white/10 transition-colors group-hover:text-teal-400/30">
                    0{i + 1}
                  </span>
                  <Icon className="h-8 w-8 text-teal-300" aria-hidden />
                  <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-teal-300">
                    {step}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">{text}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
          <div className="mt-12 text-center">
            <Button
              variant="outline"
              className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
              asChild
            >
              <Link href="/how-it-works">Walk through the workflow</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <SectionHeading
              eyebrow="Features"
              title="Everything around the change proposal"
              description="ScopePilot keeps analysis, pricing, and decisions in one place instead of scattered docs."
            />
          </Reveal>
          <Stagger className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Scope versions with effective dates",
              "AI-assisted gap summaries (review before sending)",
              "Change proposals with PDF export",
              "Client approval links with decision history",
              "Workspace roles for prepare vs send",
              "Audit events for billing disputes",
            ].map((feature) => (
              <StaggerItem key={feature}>
                <div className="flex gap-3 rounded-2xl border border-transparent bg-secondary/60 p-4 text-sm transition-all hover:border-primary/20 hover:bg-card hover:shadow-sm">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <span className="font-medium">{feature}</span>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
          <p className="mt-10 text-center">
            <Link href="/features" className="text-sm font-semibold text-primary hover:underline">
              See all features →
            </Link>
          </p>
        </div>
      </section>

      {/* Client benefits */}
      <section className="border-y bg-secondary/40 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <SectionHeading
              eyebrow="Client benefits"
              title="Clients get clarity, not friction"
              description="When approvals are structured, clients respond faster because the decision is easy to understand."
            />
          </Reveal>
          <Stagger className="mx-auto mt-12 grid max-w-3xl gap-3">
            {[
              "Side-by-side view of original scope vs requested change",
              "Transparent pricing for additional work before it starts",
              "Single link to approve, decline, or ask for revisions",
              "Record of decisions for finance and procurement",
            ].map((item) => (
              <StaggerItem key={item}>
                <div className="flex gap-3 rounded-2xl border bg-card px-5 py-4 text-sm shadow-sm">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-hidden />
                  <span className="font-medium">{item}</span>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Security */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <SectionHeading
              eyebrow="Security"
              title="Principles we build on"
              description="ScopePilot handles client communications and commercial terms—security is part of the product, not an appendix."
            />
          </Reveal>
          <Stagger className="mt-12 grid gap-5 md:grid-cols-2">
            {[
              {
                title: "Least privilege",
                body: "Workspace roles limit who can send proposals, manage billing, or change integrations.",
              },
              {
                title: "Session security",
                body: "Authenticated sessions use HTTP-only cookies and can be revoked on password reset.",
              },
              {
                title: "Auditability",
                body: "Material actions on proposals and scope emit audit events for later review.",
              },
              {
                title: "Data minimization",
                body: "Collect what the workflow needs; avoid storing secrets in proposal content.",
              },
            ].map((item) => (
              <StaggerItem key={item.title}>
                <SpotlightCard className="flex gap-4 p-5" spotlightColor="rgba(45,160,140,0.12)">
                  <ShieldCheck className="h-6 w-6 shrink-0 text-primary" aria-hidden />
                  <div>
                    <h3 className="font-display text-lg font-bold">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                  </div>
                </SpotlightCard>
              </StaggerItem>
            ))}
          </Stagger>
          <p className="mt-10 text-center text-sm">
            <Link href="/security" className="font-semibold text-primary hover:underline">
              Read our security overview →
            </Link>
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section className="relative overflow-hidden border-y py-20 sm:py-24">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(173_78%_40%/0.08),transparent_60%)]"
        />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <SectionHeading
              eyebrow="Pricing hypothesis"
              title="Simple tiers while we learn"
              description="These numbers are placeholders for early validation—not a public price promise. Tell us what would fit your practice."
            />
          </Reveal>
          <Stagger className="mt-14 grid gap-6 lg:grid-cols-3">
            {[
              {
                name: "Free",
                price: "₹0",
                note: "For solo freelancers testing the workflow",
                items: ["1 workspace", "Limited active projects", "Change proposals & approvals"],
              },
              {
                name: "Pro",
                price: "₹799",
                note: "Hypothesis / month · solo power users",
                items: ["Higher project limits", "PDF exports", "Email notifications"],
                highlight: true,
              },
              {
                name: "Agency",
                price: "₹1,999",
                note: "Hypothesis / month · small teams",
                items: ["Multiple seats", "Roles & permissions", "Priority support intent"],
              },
            ].map((tier) => (
              <StaggerItem key={tier.name}>
                <div
                  className={`flex h-full flex-col rounded-2xl border bg-card p-6 transition-shadow hover:shadow-lift ${
                    tier.highlight
                      ? "gradient-border border-primary/30 shadow-glow ring-1 ring-primary/20"
                      : ""
                  }`}
                >
                  {tier.highlight ? (
                    <span className="mb-2 w-fit rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                      Popular
                    </span>
                  ) : null}
                  <p className="text-sm font-semibold text-muted-foreground">{tier.name}</p>
                  <p className="mt-2 font-display text-4xl font-extrabold">
                    {tier.highlight ? <GradientText>{tier.price}</GradientText> : tier.price}
                    {tier.name !== "Free" ? (
                      <span className="text-base font-normal text-muted-foreground"> / mo</span>
                    ) : null}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{tier.note}</p>
                  <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                    {tier.items.map((i) => (
                      <li key={i} className="flex gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                        {i}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-8 w-full"
                    variant={tier.highlight ? "default" : "outline"}
                    asChild
                  >
                    <Link href="/app">Open app</Link>
                  </Button>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
          <p className="mt-8 text-center text-xs text-muted-foreground">
            Hypothesis pricing only ·{" "}
            <Link href="/pricing" className="underline hover:text-foreground">
              Full pricing page
            </Link>
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Reveal>
            <SectionHeading eyebrow="FAQ" title="Common questions" />
          </Reveal>
          <dl className="mt-12 space-y-2">
            {faqs.map((item, i) => (
              <Reveal key={item.q} delay={i * 0.05}>
                <div className="rounded-2xl border bg-card/60 px-5 py-5 transition-colors hover:bg-card">
                  <dt className="font-display text-base font-bold">{item.q}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.a}</dd>
                </div>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t py-20 sm:py-24">
        <AuroraBg />
        <div className="relative mx-auto max-w-2xl px-4 text-center sm:px-6">
          <Reveal>
            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Document the next change <GradientText>before you build it</GradientText>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Create a workspace, import your scope baseline, and send your first proposal when the
              next request lands.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Magnet>
                <Button size="lg" asChild>
                  <Link href="/app">Open app</Link>
                </Button>
              </Magnet>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Talk to us</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
