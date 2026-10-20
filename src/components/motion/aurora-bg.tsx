"use client";

import { cn } from "@/lib/utils/cn";

/** Soft aurora / grainient-style background — CSS only for zero lag. */
export function AuroraBg({
  className,
  variant = "teal",
}: {
  className?: string;
  variant?: "teal" | "pending" | "money" | "ink" | "auth";
}) {
  const blobs =
    variant === "pending"
      ? "from-amber-400/30 via-orange-300/15 to-rose-400/20"
      : variant === "money"
        ? "from-emerald-400/25 via-teal-300/15 to-cyan-400/20"
        : variant === "ink"
          ? "from-teal-400/25 via-cyan-500/10 to-amber-400/15"
          : variant === "auth"
            ? "from-teal-500/20 via-sky-400/10 to-amber-400/15"
            : "from-teal-400/30 via-cyan-300/15 to-emerald-400/20";

  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div
        className={cn(
          "absolute -left-1/4 -top-1/3 h-[70%] w-[70%] rounded-full bg-gradient-to-br blur-3xl animate-aurora-shift",
          blobs
        )}
      />
      <div
        className={cn(
          "absolute -bottom-1/4 -right-1/4 h-[60%] w-[60%] rounded-full bg-gradient-to-tl blur-3xl animate-aurora-shift [animation-delay:-5s]",
          blobs
        )}
      />
      <div className="absolute inset-0 opacity-[0.04] [background-image:radial-gradient(hsl(var(--foreground))_1px,transparent_1px)] [background-size:24px_24px]" />
    </div>
  );
}
