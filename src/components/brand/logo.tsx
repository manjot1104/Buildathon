import Link from "next/link";

import { cn } from "@/lib/utils/cn";

export function BrandMark({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const dim = size === "sm" ? "size-7 text-[10px]" : size === "lg" ? "size-11 text-sm" : "size-8 text-xs";
  return (
    <span
      className={cn(
        "relative flex items-center justify-center rounded-xl bg-gradient-to-br from-primary via-teal-600 to-emerald-700 font-display font-bold text-primary-foreground shadow-glow",
        dim,
        className
      )}
    >
      <span className="absolute inset-0 rounded-xl bg-[linear-gradient(135deg,transparent_40%,rgba(255,255,255,0.25)_50%,transparent_60%)] bg-[length:200%_200%] animate-shimmer" />
      <span className="relative">SP</span>
    </span>
  );
}

export function BrandLogo({
  className,
  href = "/",
  showWordmark = true,
}: {
  className?: string;
  href?: string;
  showWordmark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2.5 font-display text-lg font-bold tracking-tight text-foreground",
        className
      )}
    >
      <BrandMark />
      {showWordmark ? (
        <span>
          Scope<span className="text-primary">Pilot</span>
        </span>
      ) : null}
    </Link>
  );
}
