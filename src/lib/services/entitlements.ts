import { AppError } from "@/lib/errors";
import type { PlanId } from "@/models";
import type { WorkspaceDocument } from "@/models/Workspace";

export interface PlanEntitlements {
  planId: PlanId;
  maxActiveProjects: number;
  maxProposalsPerMonth: number;
  maxTeamMembers: number;
  aiAnalysis: boolean;
  customBranding: boolean;
}

export const PLAN_ENTITLEMENTS: Record<PlanId, PlanEntitlements> = {
  free: {
    planId: "free",
    maxActiveProjects: 3,
    maxProposalsPerMonth: 5,
    maxTeamMembers: 1,
    aiAnalysis: false,
    customBranding: false,
  },
  pro: {
    planId: "pro",
    maxActiveProjects: 25,
    maxProposalsPerMonth: 50,
    maxTeamMembers: 5,
    aiAnalysis: true,
    customBranding: true,
  },
  agency: {
    planId: "agency",
    maxActiveProjects: 200,
    maxProposalsPerMonth: 500,
    maxTeamMembers: 50,
    aiAnalysis: true,
    customBranding: true,
  },
};

export function getEntitlements(planId: PlanId): PlanEntitlements {
  return PLAN_ENTITLEMENTS[planId] ?? PLAN_ENTITLEMENTS.free;
}

function currentMonthKey(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function ensureUsageMonth(workspace: WorkspaceDocument): void {
  const key = currentMonthKey();
  if (!workspace.usage) {
    workspace.usage = {
      activeProjects: 0,
      proposalsThisMonth: 0,
      usageMonthKey: key,
    };
    return;
  }
  if (workspace.usage.usageMonthKey !== key) {
    workspace.usage.usageMonthKey = key;
    workspace.usage.proposalsThisMonth = 0;
  }
}

export function assertCanCreateProject(workspace: WorkspaceDocument, activeCount: number): void {
  const entitlements = getEntitlements(workspace.planId as PlanId);
  if (activeCount >= entitlements.maxActiveProjects) {
    throw new AppError(
      "FORBIDDEN",
      `Your ${entitlements.planId} plan allows ${entitlements.maxActiveProjects} active projects. Upgrade to add more.`
    );
  }
}

export function assertCanSendProposal(workspace: WorkspaceDocument): void {
  ensureUsageMonth(workspace);
  const entitlements = getEntitlements(workspace.planId as PlanId);
  const used = workspace.usage?.proposalsThisMonth ?? 0;
  if (used >= entitlements.maxProposalsPerMonth) {
    throw new AppError(
      "FORBIDDEN",
      `Your ${entitlements.planId} plan allows ${entitlements.maxProposalsPerMonth} proposals per month. Upgrade or wait until next month.`
    );
  }
}

export function assertCanUseAi(workspace: WorkspaceDocument): void {
  const entitlements = getEntitlements(workspace.planId as PlanId);
  if (!entitlements.aiAnalysis) {
    throw new AppError(
      "FORBIDDEN",
      "AI analysis is available on Pro and Agency plans. You can still analyze requests manually."
    );
  }
}
