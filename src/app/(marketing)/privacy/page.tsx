import type { Metadata } from "next";
import Link from "next/link";

import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Privacy policy for ScopePilot — what we collect and why.",
};

export default function PrivacyPage() {
  return (
    <div className="py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Legal"
          title="Privacy policy"
          description="Last updated: October 2025. This policy describes how ScopePilot handles personal data for account holders and data you upload about client projects."
        />
        <article className="mt-12 space-y-8 text-sm leading-relaxed text-muted-foreground [&_a]:font-medium [&_a]:text-primary [&_a:hover]:underline [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:mt-1 [&_p]:mt-3 [&_strong]:font-medium [&_strong]:text-foreground [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
          <h2>Who we are</h2>
          <p>
            ScopePilot provides software for documenting project scope, change proposals, and client
            approvals. The data controller for your account is the entity operating ScopePilot at the contact
            address listed on our <Link href="/contact">contact page</Link>.
          </p>

          <h2>Data we collect</h2>
          <ul>
            <li>
              <strong>Account data:</strong> name, email, password hash, timezone, and onboarding preferences.
            </li>
            <li>
              <strong>Workspace content:</strong> project names, scope text, client requests, proposals,
              attachments you upload, and audit metadata.
            </li>
            <li>
              <strong>Technical data:</strong> IP address, browser user agent, and session identifiers for
              security and rate limiting.
            </li>
          </ul>

          <h2>Why we use it</h2>
          <p>
            We process data to provide the service, authenticate users, deliver client approval links,
            send transactional email (verification, password reset, notifications), prevent abuse, and improve
            reliability. We do not sell personal information.
          </p>

          <h2>AI-assisted features</h2>
          <p>
            When you run scope analysis, relevant request and scope excerpts may be sent to configured AI
            providers to generate summaries. You should review outputs before sharing with clients. Do not
            upload regulated secrets or unnecessary personal data into free-text fields.
          </p>

          <h2>Retention</h2>
          <p>
            We retain workspace data while your account is active. You may request deletion of your account;
            backups may persist for a limited period before rolling off.
          </p>

          <h2>Your rights</h2>
          <p>
            Depending on your jurisdiction, you may have rights to access, correct, export, or delete personal
            data. Contact us to exercise these rights. Client data you upload may be subject to your own
            obligations toward your clients.
          </p>

          <h2>Contact</h2>
          <p>
            Privacy questions: use the form on our <Link href="/contact">contact page</Link> with the subject
            line &ldquo;Privacy&rdquo;.
          </p>
        </article>
      </div>
    </div>
  );
}
