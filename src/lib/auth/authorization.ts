import { Types } from "mongoose";
import { connectDb } from "@/lib/db/connection";
import { AppError } from "@/lib/errors";
import {
  WorkspaceMembership,
  type MembershipRole,
  type WorkspaceMembershipDocument,
} from "@/models";
import type { AuthSession } from "./session";

export interface WorkspaceContext {
  workspaceId: string;
  membership: WorkspaceMembershipDocument;
  role: MembershipRole;
}

const OWNER_ADMIN: MembershipRole[] = ["owner", "admin"];

export async function requireWorkspaceMember(
  session: AuthSession,
  workspaceId: string
): Promise<WorkspaceContext> {
  if (!Types.ObjectId.isValid(workspaceId)) {
    throw new AppError("NOT_FOUND", "Workspace not found");
  }

  await connectDb();
  const membership = await WorkspaceMembership.findOne({
    workspaceId,
    userId: session.user.id,
    status: "active",
  });

  if (!membership) {
    throw new AppError("FORBIDDEN", "You do not have access to this workspace");
  }

  return {
    workspaceId,
    membership,
    role: membership.role as MembershipRole,
  };
}

export async function requireWorkspaceRole(
  session: AuthSession,
  workspaceId: string,
  roles: MembershipRole[]
): Promise<WorkspaceContext> {
  const ctx = await requireWorkspaceMember(session, workspaceId);
  if (!roles.includes(ctx.role)) {
    throw new AppError("FORBIDDEN", "Insufficient permissions for this action");
  }
  return ctx;
}

export async function requireCanManageBilling(
  session: AuthSession,
  workspaceId: string
): Promise<WorkspaceContext> {
  const ctx = await requireWorkspaceMember(session, workspaceId);
  if (
    !OWNER_ADMIN.includes(ctx.role) &&
    !ctx.membership.permissions?.canManageBilling
  ) {
    throw new AppError("FORBIDDEN", "Billing management permission required");
  }
  return ctx;
}

export async function requireCanManageTeam(
  session: AuthSession,
  workspaceId: string
): Promise<WorkspaceContext> {
  const ctx = await requireWorkspaceMember(session, workspaceId);
  if (!OWNER_ADMIN.includes(ctx.role) && !ctx.membership.permissions?.canManageTeam) {
    throw new AppError("FORBIDDEN", "Team management permission required");
  }
  return ctx;
}

export async function requireCanSendProposals(
  session: AuthSession,
  workspaceId: string
): Promise<WorkspaceContext> {
  const ctx = await requireWorkspaceMember(session, workspaceId);
  if (
    !OWNER_ADMIN.includes(ctx.role) &&
    !ctx.membership.permissions?.canSendProposals
  ) {
    throw new AppError("FORBIDDEN", "Permission to send proposals required");
  }
  return ctx;
}

export function assertObjectId(id: string, label = "Resource"): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("NOT_FOUND", `${label} not found`);
  }
  return new Types.ObjectId(id);
}
