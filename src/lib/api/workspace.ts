import { cookies } from "next/headers";
import { requireSession, type AuthSession } from "@/lib/auth/session";
import { requireWorkspaceMember, type WorkspaceContext } from "@/lib/auth/authorization";
import { AppError } from "@/lib/errors";
import { connectDb } from "@/lib/db/connection";
import { WorkspaceMembership } from "@/models";

const WORKSPACE_COOKIE = "scopepilot_workspace";

export async function getActiveWorkspaceId(session: AuthSession): Promise<string> {
  await connectDb();
  const fromCookie = cookies().get(WORKSPACE_COOKIE)?.value;
  if (fromCookie) {
    const membership = await WorkspaceMembership.findOne({
      workspaceId: fromCookie,
      userId: session.user.id,
      status: "active",
    });
    if (membership) return fromCookie;
  }

  const first = await WorkspaceMembership.findOne({
    userId: session.user.id,
    status: "active",
  }).sort({ createdAt: 1 });

  if (!first) throw new AppError("NOT_FOUND", "No workspace found. Complete onboarding first.");
  return String(first.workspaceId);
}

export async function requireAuthWorkspace(): Promise<{
  session: AuthSession;
  workspace: WorkspaceContext;
}> {
  const session = await requireSession();
  const workspaceId = await getActiveWorkspaceId(session);
  const workspace = await requireWorkspaceMember(session, workspaceId);
  return { session, workspace };
}

export function setWorkspaceCookieValue(workspaceId: string) {
  cookies().set(WORKSPACE_COOKIE, workspaceId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
