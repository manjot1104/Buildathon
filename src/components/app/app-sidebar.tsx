"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Building2,
  ChevronDown,
  CreditCard,
  HelpCircle,
  LayoutDashboard,
  Link2,
  Menu,
  FolderKanban,
  Settings,
  Shield,
  User,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

import { BrandMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

const mainNav = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/app/projects", label: "Projects", icon: FolderKanban },
  { href: "/app/clients", label: "Clients", icon: Users },
  { href: "/app/notifications", label: "Notifications", icon: Bell },
];

const settingsNav = [
  { href: "/app/settings/profile", label: "Profile", icon: User },
  { href: "/app/settings/workspace", label: "Workspace", icon: Building2 },
  { href: "/app/settings/team", label: "Team", icon: Users },
  { href: "/app/settings/security", label: "Security", icon: Shield },
  { href: "/app/settings/notifications", label: "Notifications", icon: Bell },
  { href: "/app/settings/integrations", label: "Integrations", icon: Link2 },
  { href: "/app/settings/billing", label: "Billing", icon: CreditCard },
];

function NavLink({
  href,
  label,
  icon: Icon,
  exact,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        active
          ? "bg-primary/10 text-primary shadow-sm"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      {active ? (
        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
      ) : null}
      <Icon className="size-4 shrink-0" aria-hidden />
      {label}
    </Link>
  );
}

export function AppSidebar({
  mobileOpen,
  onMobileOpenChange,
}: {
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(
    pathname.startsWith("/app/settings")
  );

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b border-border/60 px-4">
        <Link href="/app" className="inline-flex items-center gap-2.5 font-display text-lg font-bold tracking-tight">
          <BrandMark size="sm" />
          <span>
            Scope<span className="text-primary">Pilot</span>
          </span>
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="ml-auto lg:hidden"
          onClick={() => onMobileOpenChange(false)}
          aria-label="Close menu"
        >
          <X className="size-5" />
        </Button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {mainNav.map((item) => (
          <NavLink key={item.href} {...item} onNavigate={() => onMobileOpenChange(false)} />
        ))}

        <div className="pt-4">
          <button
            type="button"
            onClick={() => setSettingsOpen((v) => !v)}
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith("/app/settings")
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Settings className="size-4 shrink-0" aria-hidden />
            Settings
            <ChevronDown
              className={cn("ml-auto size-4 transition-transform", settingsOpen && "rotate-180")}
              aria-hidden
            />
          </button>
          {settingsOpen ? (
            <div className="ml-2 mt-1 space-y-0.5 border-l pl-2">
              {settingsNav.map((item) => (
                <NavLink key={item.href} {...item} onNavigate={() => onMobileOpenChange(false)} />
              ))}
            </div>
          ) : null}
        </div>

        <div className="pt-2">
          <NavLink
            href="/app/help"
            label="Help"
            icon={HelpCircle}
            onNavigate={() => onMobileOpenChange(false)}
          />
        </div>
      </nav>
    </div>
  );

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-border/60 bg-card/80 backdrop-blur-md lg:block">
        {sidebarContent}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            aria-label="Close menu overlay"
            onClick={() => onMobileOpenChange(false)}
          />
          <aside className="relative h-full w-72 max-w-[85vw] border-r bg-card shadow-lg">
            {sidebarContent}
          </aside>
        </div>
      ) : null}
    </>
  );
}

export function AppSidebarMobileTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <Button type="button" variant="ghost" size="icon" className="lg:hidden" onClick={onOpen} aria-label="Open menu">
      <Menu className="size-5" />
    </Button>
  );
}
