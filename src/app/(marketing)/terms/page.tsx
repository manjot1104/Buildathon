import type { Metadata } from "next";
import Link from "next/link";

import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "Terms governing use of ScopePilot during early access.",
};

export default function TermsPage() {
  return (
    <div className="py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Legal"
          title="Terms of service"
          description="Last updated: October 2025. By creating an account or using ScopePilot, you agree to these terms."
        />
        <article className="mt-12 space-y-8 text-sm leading-relaxed text-muted-foreground [&_a]:font-medium [&_a]:text-primary [&_a:hover]:underline [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_p]:mt-3">
          <h2>Service description</h2>
          <p>
            ScopePilot is provided as a hosted application for scope documentation and change proposals. Features
            may change during early access. Hypothesis pricing on our marketing site is not a binding offer until
            we publish paid plans with checkout.
          </p>

          <h2>Your responsibilities</h2>
          <p>
            You are responsible for the accuracy of scope and pricing you send to clients, for obtaining lawful
            bases to process client data you upload, and for keeping your credentials secure. You must not use
            the service to distribute malware, spam, or unlawful content.
          </p>

          <h2>Acceptable use</h2>
          <p>
            We may suspend accounts that degrade platform stability, attempt unauthorized access, or violate
            applicable law. We will provide notice when practical.
          </p>

          <h2>Intellectual property</h2>
          <p>
            You retain ownership of content you upload. You grant us a limited license to host, process, and
            display that content solely to operate the service. ScopePilot&apos;s software, branding, and
            documentation remain our property.
          </p>

          <h2>Disclaimers</h2>
          <p>
            The service is provided &ldquo;as is&rdquo; during early access without warranties of uninterrupted
            availability. ScopePilot does not provide legal advice; change proposals are documents you control,
            not automatic enforceable contracts unless your jurisdiction and process say otherwise.
          </p>

          <h2>Limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, our aggregate liability arising from the service is limited
            to the fees you paid us in the twelve months before the claim, or zero during free early access.
          </p>

          <h2>Changes</h2>
          <p>
            We may update these terms. Material changes will be announced via email or in-app notice. Continued
            use after the effective date constitutes acceptance.
          </p>

          <h2>Contact</h2>
          <p>
            Legal or terms questions: <Link href="/contact">contact us</Link>.
          </p>
        </article>
      </div>
    </div>
  );
}
