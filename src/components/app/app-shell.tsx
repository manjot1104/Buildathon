"use client";

import { useState } from "react";

import { AppSidebar } from "@/components/app/app-sidebar";
import { AppTopbar } from "@/components/app/app-topbar";

export function AppShell({
  workspaceName,
  userName,
  userEmail,
  unreadNotifications,
  children,
}: {
  workspaceName: string | null;
  userName: string;
  userEmail: string;
  unreadNotifications: number;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar mobileOpen={mobileOpen} onMobileOpenChange={setMobileOpen} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar
          workspaceName={workspaceName}
          userName={userName}
          userEmail={userEmail}
          unreadNotifications={unreadNotifications}
          onMobileMenuOpen={() => setMobileOpen(true)}
        />
        <main className="relative flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_at_top,hsl(173_78%_40%/0.06),transparent_70%)]"
          />
          <div className="relative animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
