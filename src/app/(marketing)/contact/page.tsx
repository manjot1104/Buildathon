import type { Metadata } from "next";

import { SectionHeading } from "@/components/marketing/section-heading";
import { ContactForm } from "@/components/marketing/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the ScopePilot team.",
};

export default function ContactPage() {
  return (
    <div className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Contact"
              title="Talk to us"
              description="Questions about change proposals, early access, security, or pricing hypotheses—we read every message."
            />
            <dl className="mt-10 space-y-6 text-sm">
              <div>
                <dt className="font-medium text-foreground">Product feedback</dt>
                <dd className="mt-1 text-muted-foreground">
                  Tell us how you handle scope creep today and what would make approvals easier for your
                  clients.
                </dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">Security</dt>
                <dd className="mt-1 text-muted-foreground">
                  Include &ldquo;Security&rdquo; in the subject if you are reporting a vulnerability.
                </dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">Response time</dt>
                <dd className="mt-1 text-muted-foreground">
                  We typically reply within two business days during early access.
                </dd>
              </div>
            </dl>
          </div>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
