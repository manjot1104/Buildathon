import { redirect } from "next/navigation";
import Link from "next/link";

import { BrandMark } from "@/components/brand/logo";
import { getSessionFromCookies } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");
  if (session.user.role !== "platform_admin") redirect("/app");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 font-display text-sm font-bold tracking-tight"
            >
              <BrandMark size="sm" />
              ScopePilot Admin
            </Link>
            <nav className="flex gap-1 text-sm">
              {[
                { href: "/admin/users", label: "Users" },
                { href: "/admin/workspaces", label: "Workspaces" },
                { href: "/admin/audit-logs", label: "Audit logs" },
                { href: "/admin/settings", label: "Settings" },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <Link
            href="/app"
            className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Back to app
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 animate-fade-in">{children}</main>
    </div>
  );
}
