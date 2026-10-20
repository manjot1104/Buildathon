import Link from "next/link";

import { BrandMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils/cn";

export function AuthLogo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2.5 font-display text-xl font-bold tracking-tight",
        className
      )}
    >
      <BrandMark />
      <span>
        Scope<span className="text-primary">Pilot</span>
      </span>
    </Link>
  );
}

export function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="gradient-border w-full max-w-md p-6 shadow-lift sm:p-8">
      <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
      {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
      <div className="mt-6">{children}</div>
    </div>
  );
}
