"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils/cn";
import { usePrefersReducedMotion } from "@/lib/motion/reduced";

/** React Bits SpotlightCard — pointer-lit surface. */
export function SpotlightCard({
  children,
  className,
  spotlightColor = "rgba(45, 180, 160, 0.18)",
}: {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hover, setHover] = useState(false);
  const reduced = usePrefersReducedMotion();

  function onMove(e: React.MouseEvent) {
    if (!ref.current || reduced) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      whileHover={reduced ? undefined : { y: -3 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-card/80 backdrop-blur-sm transition-shadow hover:shadow-lift",
        className
      )}
      style={
        !reduced && hover
          ? {
              backgroundImage: `radial-gradient(420px circle at ${pos.x}px ${pos.y}px, ${spotlightColor}, transparent 55%)`,
            }
          : undefined
      }
    >
      {children}
    </motion.div>
  );
}
