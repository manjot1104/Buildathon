"use client";

import { cn } from "@/lib/utils/cn";

/** React Bits GradientText — living gradient sweep on type. */
export function GradientText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "bg-[linear-gradient(110deg,hsl(173_78%_32%),hsl(168_85%_42%),hsl(28_92%_54%),hsl(200_70%_45%),hsl(173_78%_32%))] bg-[length:200%_auto] bg-clip-text text-transparent animate-shimmer",
        className
      )}
    >
      {children}
    </span>
  );
}
