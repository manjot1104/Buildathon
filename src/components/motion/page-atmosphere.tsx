"use client";

import { cn } from "@/lib/utils/cn";
import { AuroraBg } from "@/components/motion/aurora-bg";

export type AtmosphereKind =
  | "default"
  | "pending"
  | "money"
  | "approval"
  | "security"
  | "auth"
  | "dashboard";

const styles: Record<
  AtmosphereKind,
  { wrapper: string; aurora: "teal" | "pending" | "money" | "ink" | "auth"; badge?: string }
> = {
  default: { wrapper: "", aurora: "teal" },
  pending: {
    wrapper: "relative",
    aurora: "pending",
    badge: "Pending / waiting",
  },
  money: {
    wrapper: "relative",
    aurora: "money",
    badge: "Payments & billing",
  },
  approval: {
    wrapper: "relative",
    aurora: "teal",
    badge: "Decision required",
  },
  security: {
    wrapper: "relative bg-ink text-ink-foreground",
    aurora: "ink",
  },
  auth: {
    wrapper: "relative",
    aurora: "auth",
  },
  dashboard: {
    wrapper: "relative",
    aurora: "teal",
  },
};

/** Contextual page atmosphere matching functionality (pending = amber, money = emerald, etc.). */
export function PageAtmosphere({
  kind = "default",
  children,
  className,
  showLabel = false,
}: {
  kind?: AtmosphereKind;
  children: React.ReactNode;
  className?: string;
  showLabel?: boolean;
}) {
  const s = styles[kind];

  return (
    <div className={cn(s.wrapper, className)}>
      {kind !== "default" ? <AuroraBg variant={s.aurora} className="opacity-80" /> : null}
      {showLabel && s.badge ? (
        <div className="relative z-[1] mb-4">
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
              kind === "pending" &&
                "border-pending/40 bg-pending/10 text-amber-900 animate-pending-pulse",
              kind === "money" && "border-money/40 bg-money/10 text-emerald-900",
              kind === "approval" && "border-primary/40 bg-primary/10 text-primary"
            )}
          >
            <span className="size-1.5 rounded-full bg-current" />
            {s.badge}
          </span>
        </div>
      ) : null}
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
