"use client";

import { TiltCard } from "@/components/motion/tilt-card";

/** Static product UI mock for marketing — not live data. */
export function ProposalPreview() {
  return (
    <TiltCard className="shadow-lift">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-card/95 backdrop-blur-md ring-1 ring-black/5">
        <div className="flex items-center justify-between border-b border-border/60 bg-gradient-to-r from-secondary/80 to-background px-4 py-3.5">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Change proposal · CP-1042</p>
            <p className="font-display text-sm font-semibold">Add bilingual checkout flow</p>
          </div>
          <span className="animate-pending-pulse rounded-full border border-pending/40 bg-pending/15 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
            Pending approval
          </span>
        </div>
        <div className="grid gap-0 sm:grid-cols-2">
          <div className="border-b border-border/60 p-4 sm:border-b-0 sm:border-r">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Original scope
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-success">✓</span>
                Single-language checkout (EN)
              </li>
              <li className="flex gap-2">
                <span className="text-success">✓</span>
                Stripe payment + receipt email
              </li>
            </ul>
          </div>
          <div className="relative p-4">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-pending/5 to-transparent"
            />
            <p className="relative text-xs font-semibold uppercase tracking-wide text-pending">
              Requested change
            </p>
            <p className="relative mt-3 text-sm leading-relaxed">
              Hindi + English checkout copy, locale switcher, and QA on mobile widths.
            </p>
            <p className="relative mt-3 text-xs text-muted-foreground">
              Impact: +12–16 hours · Not in SOW v2
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 bg-gradient-to-r from-money/5 via-transparent to-primary/5 px-4 py-3.5">
          <div>
            <p className="text-xs text-muted-foreground">Proposed fee</p>
            <p className="font-display text-lg font-bold text-money">₹24,000</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-full border border-input bg-background px-3 py-1.5 text-xs font-medium"
              tabIndex={-1}
            >
              Request changes
            </button>
            <button
              type="button"
              className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-glow"
              tabIndex={-1}
            >
              Approve & proceed
            </button>
          </div>
        </div>
      </div>
    </TiltCard>
  );
}
