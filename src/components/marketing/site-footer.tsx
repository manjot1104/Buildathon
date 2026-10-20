import Link from "next/link";

import { BrandLogo } from "@/components/brand/logo";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils/cn";

const productLinks = [
  { href: "/features", label: "Features" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/security", label: "Security" },
  { href: "/app", label: "Open app" },
] as const;

const legalLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
] as const;

export interface SiteFooterProps {
  className?: string;
}

export function SiteFooter({ className }: SiteFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className={cn("relative overflow-hidden border-t bg-ink text-ink-foreground", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(173_78%_40%/0.18),transparent_55%)]"
      />
      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3">
          <div className="space-y-4 sm:col-span-2 md:col-span-1">
            <BrandLogo className="text-ink-foreground [&_span:last-child]:text-teal-300" />
            <p className="max-w-xs text-sm leading-relaxed text-white/60">
              Know what&apos;s included, document what&apos;s extra, and get approval before
              additional work.
            </p>
          </div>

          <div>
            <h2 className="font-display text-sm font-semibold text-white">Product</h2>
            <ul className="mt-4 space-y-2.5">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/55 transition-colors hover:text-teal-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-display text-sm font-semibold text-white">Legal</h2>
            <ul className="mt-4 space-y-2.5">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/55 transition-colors hover:text-teal-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-10 bg-white/10" />

        <p className="text-center text-xs text-white/40 sm:text-left">
          © {year} ScopePilot. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
