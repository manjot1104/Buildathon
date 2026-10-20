"use client";

import { cn } from "@/lib/utils/cn";

/** React Bits ShinyText — chrome sheen across labels. */
export function ShinyText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative inline-block bg-[linear-gradient(90deg,hsl(var(--muted-foreground))_0%,hsl(var(--muted-foreground))_40%,hsl(var(--foreground))_50%,hsl(var(--muted-foreground))_60%,hsl(var(--muted-foreground))_100%)] bg-[length:200%_100%] bg-clip-text text-transparent animate-shimmer",
        className
      )}
    >
      {children}
    </span>
  );
}
