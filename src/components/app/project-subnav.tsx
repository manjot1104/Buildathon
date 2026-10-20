"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils/cn";

export function ProjectSubnav({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const base = `/app/projects/${projectId}`;

  const items = [
    { href: base, label: "Overview", exact: true },
    { href: `${base}/scope`, label: "Scope" },
    { href: `${base}/requests`, label: "Requests" },
    { href: `${base}/changes`, label: "Changes" },
    { href: `${base}/activity`, label: "Activity" },
  ];

  return (
    <nav className="-mx-1 mb-6 flex flex-wrap gap-1 border-b pb-px">
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-t-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
