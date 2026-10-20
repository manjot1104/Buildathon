import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/errors";
import {
  assertCanCreateProject,
  assertCanSendProposal,
  getEntitlements,
} from "./entitlements";

describe("entitlements", () => {
  it("returns free plan limits", () => {
    const e = getEntitlements("free");
    expect(e.maxActiveProjects).toBe(3);
    expect(e.maxProposalsPerMonth).toBe(5);
    expect(e.aiAnalysis).toBe(false);
  });

  it("blocks creating projects beyond plan limit", () => {
    const workspace = {
      planId: "free",
      usage: { activeProjects: 0, proposalsThisMonth: 0, usageMonthKey: "2026-10" },
    } as never;
    expect(() => assertCanCreateProject(workspace, 3)).toThrow(AppError);
  });

  it("blocks sending proposals beyond monthly limit", () => {
    const workspace = {
      planId: "free",
      usage: {
        activeProjects: 1,
        proposalsThisMonth: 5,
        usageMonthKey: `${new Date().getUTCFullYear()}-${String(new Date().getUTCMonth() + 1).padStart(2, "0")}`,
      },
    } as never;
    expect(() => assertCanSendProposal(workspace)).toThrow(AppError);
  });
});
