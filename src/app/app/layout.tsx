import { redirect } from "next/navigation";

import { AppShell } from "@/components/app/app-shell";
import { OnboardingGate } from "@/components/app/onboarding-gate";
import { connectDb } from "@/lib/db/connection";
import { getSessionFromCookies } from "@/lib/auth/session";
import { getActiveWorkspaceId } from "@/lib/api/workspace";
import { getEnv } from "@/lib/config/env";
import { Notification, Workspace } from "@/models";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionFromCookies();
  if (!session) {
    // Local open access: enter via route handler (can set cookies), else marketing home
    redirect(getEnv().DEMO_OPEN_ACCESS ? "/api/v1/auth/demo" : "/");
  }

  let workspaceName: string | null = null;
  let unreadNotifications = 0;

  if (session.user.onboardingCompletedAt) {
    try {
      await connectDb();
      const workspaceId = await getActiveWorkspaceId(session);
      const [workspace, notifications] = await Promise.all([
        Workspace.findById(workspaceId).lean(),
        Notification.find({
          workspaceId,
          userId: session.user.id,
          readAt: null,
        })
          .limit(100)
          .lean(),
      ]);
      workspaceName = workspace?.name ?? null;
      unreadNotifications = notifications.length;
    } catch {
      workspaceName = null;
      unreadNotifications = 0;
    }
  }

  return (
    <>
      <OnboardingGate onboardingCompleted={Boolean(session.user.onboardingCompletedAt)} />
      <AppShell
        workspaceName={workspaceName}
        userName={session.user.name}
        userEmail={session.user.email}
        unreadNotifications={unreadNotifications}
      >
        {children}
      </AppShell>
    </>
  );
}
