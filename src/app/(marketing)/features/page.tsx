import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { SectionHeading } from "@/components/marketing/section-heading";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { SpotlightCard } from "@/components/motion/spotlight-card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Features",
  description: "Scope versions, change proposals, client approvals, and audit trails for scope control.",
};

const groups = [
  {
    title: "Scope baseline",
    accent: "border-l-primary",
    items: [
      "Versioned scope documents per project with effective dates",
      "Attach SOW PDFs or paste structured inclusions",
      "Mark items as in-scope, optional, or explicitly out of scope",
    ],
  },
  {
    title: "Requests & analysis",
    accent: "border-l-sky-500",
    items: [
      "Capture client requests with source channel and attachments",
      "Compare requests against the active scope version",
      "AI-generated gap summaries with human review before send",
    ],
  },
  {
    title: "Change proposals",
    accent: "border-l-pending",
    items: [
      "Package scope delta, effort, and fee in one client-facing view",
      "Export proposal PDFs for procurement or offline sign-off",
      "Track draft, sent, approved, declined, and superseded states",
    ],
  },
  {
    title: "Client experience",
    accent: "border-l-money",
    items: [
      "Magic links for approve / decline / request revision",
      "No client login required for standard approvals",
      "Decision timestamp and actor stored on the proposal",
    ],
  },
  {
    title: "Team & governance",
    accent: "border-l-violet-500",
    items: [
      "Workspace roles: prepare proposals vs send to client",
      "Audit events on scope edits, sends, and decisions",
      "Notifications when clients act on a proposal",
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <SectionHeading
            eyebrow="Features"
            title="Built around the change proposal"
            description="Every capability exists to make scope boundaries explicit—before the work starts."
          />
        </Reveal>
        <Stagger className="mt-14 grid gap-5 md:grid-cols-2">
          {groups.map((group) => (
            <StaggerItem key={group.title}>
              <SpotlightCard className={`h-full border-l-4 p-6 ${group.accent}`}>
                <h2 className="font-display text-xl font-bold">{group.title}</h2>
                <ul className="mt-4 space-y-3">
                  {group.items.map((item) => (
                    <li key={item} className="flex gap-2.5 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </SpotlightCard>
            </StaggerItem>
          ))}
        </Stagger>
        <Reveal className="mt-14 flex flex-wrap justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/app">Open app</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/how-it-works">See the workflow</Link>
          </Button>
        </Reveal>
      </div>
    </div>
  );
}
