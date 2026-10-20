"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LogOut, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppSidebarMobileTrigger } from "@/components/app/app-sidebar";
import { postAuthJson } from "@/lib/auth/client-api";

export function AppTopbar({
  workspaceName,
  userName,
  userEmail,
  unreadNotifications,
  onMobileMenuOpen,
}: {
  workspaceName: string | null;
  userName: string;
  userEmail: string;
  unreadNotifications: number;
  onMobileMenuOpen: () => void;
}) {
  const router = useRouter();

  async function logout() {
    await postAuthJson<{ ok: boolean }>("/api/v1/auth/logout", {});
    // Open-access local demo: no login page — land on marketing home
    router.push("/");
    router.refresh();
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-card px-4">
      <AppSidebarMobileTrigger onOpen={onMobileMenuOpen} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {workspaceName ?? "Workspace"}
        </p>
        <p className="truncate text-xs text-muted-foreground">ScopePilot workspace</p>
      </div>

      <Button variant="ghost" size="icon" asChild className="relative">
        <Link href="/app/notifications" aria-label="Notifications">
          <Bell className="size-5" />
          {unreadNotifications > 0 ? (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
              {unreadNotifications > 9 ? "9+" : unreadNotifications}
            </span>
          ) : null}
        </Link>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <User className="size-4" aria-hidden />
            <span className="hidden max-w-[120px] truncate sm:inline">{userName}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <p className="text-sm font-medium">{userName}</p>
            <p className="text-xs text-muted-foreground">{userEmail}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/app/settings/profile">Profile settings</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => void logout()}>
            <LogOut className="mr-2 size-4" />
            Exit to home
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
