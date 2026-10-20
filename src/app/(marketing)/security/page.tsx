import type { Metadata } from "next";
import Link from "next/link";

import { SectionHeading } from "@/components/marketing/section-heading";
import { AuroraBg } from "@/components/motion/aurora-bg";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Security",
  description: "How ScopePilot approaches authentication, access control, and auditability.",
};

export default function SecurityPage() {
  return (
    <div className="relative overflow-hidden bg-ink py-16 text-ink-foreground sm:py-24">
      <AuroraBg variant="ink" />
      <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
        <Reveal>
          <SectionHeading
            light
            eyebrow="Security"
            title="Security overview"
            description="ScopePilot stores client scope, commercial terms, and approval decisions. This page summarizes our approach; detailed policies evolve with the product."
          />
        </Reveal>
        <Reveal delay={0.1}>
          <article className="mt-12 space-y-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm leading-relaxed text-white/65 backdrop-blur-sm sm:p-8 [&_a]:font-semibold [&_a]:text-teal-300 [&_a:hover]:underline [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-white [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
            <h2>Authentication & sessions</h2>
            <p>
              User accounts authenticate with email and password. Passwords are hashed with industry-standard
              algorithms. Successful login creates a server-side session referenced by an HTTP-only cookie,
              reducing exposure to cross-site scripting in the browser.
            </p>
            <p>
              Password reset and email verification use single-use tokens with expiration. Completing a
              password reset revokes existing sessions so stale devices lose access.
            </p>

            <h2>Authorization</h2>
            <p>
              Data is organized by workspace. Membership records define whether someone can prepare proposals,
              send them to clients, manage billing, or administer integrations. API routes enforce workspace
              scope on every mutating request.
            </p>

            <h2>Client approval links</h2>
            <p>
              Clients review proposals via time-bound tokens—no full account required. Tokens are
              unguessable, stored hashed where appropriate, and can expire. Decisions are recorded with
              timestamps for your audit trail.
            </p>

            <h2>Auditability</h2>
            <p>
              Material events (scope edits, proposal sends, client decisions) emit audit records so you can
              reconstruct what happened during billing disputes.
            </p>

            <h2>Questions</h2>
            <p>
              For security inquiries, reach us via{" "}
              <Link href="/contact">Contact</Link>.
            </p>
          </article>
        </Reveal>
      </div>
    </div>
  );
}
