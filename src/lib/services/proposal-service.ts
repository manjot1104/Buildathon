import { createHash } from "crypto";
import mongoose from "mongoose";
import { connectDb } from "@/lib/db/connection";
import { getEnv } from "@/lib/config/env";
import { AppError } from "@/lib/errors";
import { computeBreakdown, lineAmount } from "@/lib/money";
import { generateSecureToken, hashToken, isTokenExpired } from "@/lib/security/tokens";
import { rateLimit } from "@/lib/security/rate-limit";
import { assertCanSendProposal, ensureUsageMonth } from "@/lib/services/entitlements";
import { recordAudit } from "@/lib/services/audit";
import { createNotification } from "@/lib/services/notifications";
import { enqueueJob } from "@/lib/jobs/queue";
import { formatMoney } from "@/lib/money";
import {
  ChangeProposal,
  Client,
  ClientRequest,
  Project,
  ProposalDecision,
  ScopeVersion,
  Workspace,
} from "@/models";

export interface ProposalLineInput {
  description: string;
  quantity: number;
  unit: string;
  rateMinor: number;
}

function buildLineItems(items: ProposalLineInput[]) {
  return items.map((item) => {
    if (item.quantity < 0 || item.rateMinor < 0) {
      throw new AppError("VALIDATION_ERROR", "Line items cannot have negative values");
    }
    const amountMinor = lineAmount(item.quantity, item.rateMinor);
    return {
      description: item.description.trim(),
      quantity: item.quantity,
      unit: item.unit,
      rateMinor: item.rateMinor,
      amountMinor,
    };
  });
}

export async function createProposalDraft(input: {
  workspaceId: string;
  requestId: string;
  userId: string;
  title: string;
  lineItems: ProposalLineInput[];
  discountMinor?: number;
  feesMinor?: number;
  taxRateBps?: number;
  additionalWorkingDays?: number;
  proposedDeadline?: Date | null;
  deadlineExplanation?: string;
  paymentTerms?: string;
  whySeparate?: string;
  deliverables?: string[];
  exclusions?: string[];
  assumptions?: string[];
  additionalWorkDescription?: string;
  milestoneImpact?: string;
  expiresAt?: Date | null;
}) {
  await connectDb();
  const request = await ClientRequest.findOne({
    _id: input.requestId,
    workspaceId: input.workspaceId,
  });
  if (!request) throw new AppError("NOT_FOUND", "Request not found");

  const project = await Project.findOne({
    _id: request.projectId,
    workspaceId: input.workspaceId,
  });
  if (!project) throw new AppError("NOT_FOUND", "Project not found");
  if (!project.currentScopeVersionId) {
    throw new AppError("UNPROCESSABLE", "Define original scope before creating a proposal");
  }

  const lineItems = buildLineItems(input.lineItems);
  const breakdown = computeBreakdown({
    lineAmounts: lineItems.map((l) => l.amountMinor),
    discountMinor: input.discountMinor ?? 0,
    feesMinor: input.feesMinor ?? 0,
    taxRateBps: input.taxRateBps,
  });

  const count = await ChangeProposal.countDocuments({ workspaceId: input.workspaceId });
  const proposalNumber = `CR-${String(count + 1).padStart(4, "0")}`;

  const proposal = await ChangeProposal.create({
    workspaceId: input.workspaceId,
    projectId: project._id,
    requestId: request._id,
    clientId: request.clientId,
    proposalNumber,
    revision: 1,
    status: "draft",
    title: input.title.trim(),
    lineItems,
    ...breakdown,
    currency: project.currency,
    additionalWorkingDays: input.additionalWorkingDays ?? 0,
    originalDeadline: project.deadline,
    proposedDeadline: input.proposedDeadline ?? null,
    deadlineExplanation: input.deadlineExplanation ?? "",
    paymentTerms: input.paymentTerms ?? "",
    whySeparate: input.whySeparate ?? "",
    deliverables: input.deliverables ?? [],
    exclusions: input.exclusions ?? [],
    assumptions: input.assumptions ?? [],
    additionalWorkDescription: input.additionalWorkDescription ?? "",
    milestoneImpact: input.milestoneImpact ?? "",
    expiresAt: input.expiresAt ?? null,
    scopeVersionId: project.currentScopeVersionId,
    createdById: input.userId,
  });

  const previousRequestStatus = request.status;
  request.currentProposalId = proposal._id;
  request.statusHistory.push({
    from: previousRequestStatus,
    to: "proposal_draft",
    at: new Date(),
    byUserId: input.userId as unknown as never,
    note: "Proposal draft created",
  });
  request.status = "proposal_draft";
  await request.save();

  await recordAudit({
    workspaceId: input.workspaceId,
    actorUserId: input.userId,
    actorType: "user",
    eventType: "proposal.drafted",
    entityType: "change_proposal",
    entityId: proposal._id,
    summary: `Draft proposal ${proposalNumber} created`,
  });

  return proposal;
}

export async function updateProposalDraft(
  proposalId: string,
  workspaceId: string,
  updates: Partial<{
    title: string;
    lineItems: ProposalLineInput[];
    discountMinor: number;
    feesMinor: number;
    taxRateBps: number;
    additionalWorkingDays: number;
    proposedDeadline: Date | null;
    deadlineExplanation: string;
    paymentTerms: string;
    whySeparate: string;
    deliverables: string[];
    exclusions: string[];
    assumptions: string[];
    additionalWorkDescription: string;
    milestoneImpact: string;
    expiresAt: Date | null;
  }>
) {
  await connectDb();
  const proposal = await ChangeProposal.findOne({ _id: proposalId, workspaceId });
  if (!proposal) throw new AppError("NOT_FOUND", "Proposal not found");
  if (proposal.status !== "draft") {
    throw new AppError(
      "CONFLICT",
      "Sent proposals are immutable. Create a new revision to change commercial terms."
    );
  }

  if (updates.title) proposal.title = updates.title;
  if (updates.lineItems) {
    proposal.lineItems = buildLineItems(updates.lineItems) as never;
    const breakdown = computeBreakdown({
      lineAmounts: proposal.lineItems.map((l) => l.amountMinor),
      discountMinor: updates.discountMinor ?? proposal.discountMinor,
      feesMinor: updates.feesMinor ?? proposal.feesMinor,
      taxRateBps: updates.taxRateBps,
    });
    Object.assign(proposal, breakdown);
  } else if (
    updates.discountMinor !== undefined ||
    updates.feesMinor !== undefined ||
    updates.taxRateBps !== undefined
  ) {
    const breakdown = computeBreakdown({
      lineAmounts: proposal.lineItems.map((l) => l.amountMinor),
      discountMinor: updates.discountMinor ?? proposal.discountMinor,
      feesMinor: updates.feesMinor ?? proposal.feesMinor,
      taxRateBps: updates.taxRateBps,
    });
    Object.assign(proposal, breakdown);
  }

  if (updates.additionalWorkingDays !== undefined) {
    proposal.additionalWorkingDays = updates.additionalWorkingDays;
  }
  if (updates.proposedDeadline !== undefined) {
    proposal.proposedDeadline = updates.proposedDeadline;
  }
  if (updates.deadlineExplanation !== undefined) {
    proposal.deadlineExplanation = updates.deadlineExplanation;
  }
  if (updates.paymentTerms !== undefined) {
    proposal.paymentTerms = updates.paymentTerms;
  }
  if (updates.whySeparate !== undefined) {
    proposal.whySeparate = updates.whySeparate;
  }
  if (updates.deliverables !== undefined) {
    proposal.deliverables = updates.deliverables;
  }
  if (updates.exclusions !== undefined) {
    proposal.exclusions = updates.exclusions;
  }
  if (updates.assumptions !== undefined) {
    proposal.assumptions = updates.assumptions;
  }
  if (updates.additionalWorkDescription !== undefined) {
    proposal.additionalWorkDescription = updates.additionalWorkDescription;
  }
  if (updates.milestoneImpact !== undefined) {
    proposal.milestoneImpact = updates.milestoneImpact;
  }
  if (updates.expiresAt !== undefined) {
    proposal.expiresAt = updates.expiresAt;
  }

  await proposal.save();
  return proposal;
}

export async function sendProposal(input: {
  proposalId: string;
  workspaceId: string;
  userId: string;
}) {
  await connectDb();
  const workspace = await Workspace.findById(input.workspaceId);
  if (!workspace) throw new AppError("NOT_FOUND", "Workspace not found");
  assertCanSendProposal(workspace);

  const proposal = await ChangeProposal.findOne({
    _id: input.proposalId,
    workspaceId: input.workspaceId,
  });
  if (!proposal) throw new AppError("NOT_FOUND", "Proposal not found");
  if (proposal.status !== "draft") {
    throw new AppError("CONFLICT", "Only draft proposals can be sent");
  }
  if (!proposal.lineItems.length) {
    throw new AppError("VALIDATION_ERROR", "Add at least one line item before sending");
  }

  const project = await Project.findById(proposal.projectId);
  const client = await Client.findById(proposal.clientId);
  const scope = await ScopeVersion.findById(proposal.scopeVersionId);

  const rawToken = generateSecureToken(32);
  proposal.accessTokenHash = hashToken(rawToken);
  proposal.accessTokenExpiresAt =
    proposal.expiresAt ?? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  proposal.accessTokenRevokedAt = null;
  proposal.status = "sent";
  proposal.sentAt = new Date();
  proposal.sentSnapshot = {
    projectName: project?.name ?? "",
    workspaceName: workspace.name,
    clientName: client?.name ?? "",
    requestSummary: proposal.title,
    additionalWorkDescription: proposal.additionalWorkDescription,
    whySeparate: proposal.whySeparate,
    deliverables: proposal.deliverables,
    exclusions: proposal.exclusions,
    assumptions: proposal.assumptions,
    lineItems: proposal.lineItems,
    subtotalMinor: proposal.subtotalMinor,
    discountMinor: proposal.discountMinor,
    feesMinor: proposal.feesMinor,
    taxMinor: proposal.taxMinor,
    totalMinor: proposal.totalMinor,
    currency: proposal.currency,
    additionalWorkingDays: proposal.additionalWorkingDays,
    originalDeadline: proposal.originalDeadline,
    proposedDeadline: proposal.proposedDeadline,
    deadlineExplanation: proposal.deadlineExplanation,
    paymentTerms: proposal.paymentTerms,
    milestoneImpact: proposal.milestoneImpact,
    scopeVersionId: proposal.scopeVersionId,
    scopeExcerpt: [
      scope?.objectives,
      (scope?.deliverables ?? []).join(", "),
      (scope?.exclusions ?? []).join(", "),
    ]
      .filter(Boolean)
      .join("\n")
      .slice(0, 2000),
  };

  await proposal.save();

  ensureUsageMonth(workspace);
  workspace.usage!.proposalsThisMonth = (workspace.usage?.proposalsThisMonth ?? 0) + 1;
  await workspace.save();

  const request = await ClientRequest.findById(proposal.requestId);
  if (request) {
    const previousStatus = request.status;
    request.statusHistory.push({
      from: previousStatus,
      to: "sent_to_client",
      at: new Date(),
      byUserId: input.userId as unknown as never,
      note: "Proposal sent to client",
    });
    request.status = "sent_to_client";
    await request.save();
  }

  const env = getEnv();
  const approveUrl = `${env.APP_URL}/approve/${rawToken}`;

  if (client?.email) {
    await enqueueJob({
      type: "send_email",
      idempotencyKey: `proposal-sent:${proposal._id}:${proposal.revision}`,
      payload: {
        to: client.email,
        template: "proposal_sent",
        data: {
          workspaceName: workspace.name,
          projectName: project?.name ?? "",
          amount: formatMoney(proposal.totalMinor, proposal.currency),
          approveUrl,
        },
      },
    });
  }

  await recordAudit({
    workspaceId: input.workspaceId,
    actorUserId: input.userId,
    actorType: "user",
    eventType: "proposal.sent",
    entityType: "change_proposal",
    entityId: proposal._id,
    summary: `Proposal ${proposal.proposalNumber} sent`,
  });

  return { proposal, approveUrl, rawToken };
}

export async function getProposalByAccessToken(rawToken: string) {
  await connectDb();
  const proposal = await ChangeProposal.findOne({
    accessTokenHash: hashToken(rawToken),
  }).select("+accessTokenHash");

  if (!proposal) throw new AppError("NOT_FOUND", "This link is invalid");
  if (proposal.accessTokenRevokedAt) {
    throw new AppError("GONE", "This link has been revoked");
  }
  if (isTokenExpired(proposal.accessTokenExpiresAt)) {
    if (proposal.status === "sent" || proposal.status === "viewed") {
      proposal.status = "expired";
      await proposal.save();
    }
    throw new AppError("GONE", "This link has expired");
  }
  if (["withdrawn", "expired"].includes(proposal.status)) {
    throw new AppError("GONE", `This proposal is ${proposal.status}`);
  }

  return proposal;
}

export async function recordProposalView(rawToken: string, meta?: { ip?: string; ua?: string }) {
  const proposal = await getProposalByAccessToken(rawToken);
  if (proposal.status === "sent") {
    proposal.status = "viewed";
    proposal.viewedAt = new Date();
    await proposal.save();

    await createNotification({
      workspaceId: proposal.workspaceId,
      userId: proposal.createdById,
      type: "proposal_viewed",
      title: "Proposal viewed",
      body: `A client opened proposal ${proposal.proposalNumber}.`,
      href: `/app/projects/${proposal.projectId}/changes`,
      entityType: "change_proposal",
      entityId: proposal._id,
      dedupeKey: `viewed:${proposal._id}:${proposal.revision}`,
    });

    await recordAudit({
      workspaceId: proposal.workspaceId,
      actorType: "client",
      eventType: "proposal.viewed",
      entityType: "change_proposal",
      entityId: proposal._id,
      summary: "Client viewed proposal",
      ipHash: meta?.ip ? createHash("sha256").update(meta.ip).digest("hex") : null,
      metadata: { userAgent: meta?.ua ?? null },
    });
  }
  return proposal;
}

const DECIDABLE = new Set(["sent", "viewed", "clarification_requested"]);

export async function decideProposal(input: {
  rawToken: string;
  decision: "approved" | "rejected" | "clarification_requested";
  comment?: string;
  clientNameEntered?: string;
  confirmationAccepted?: boolean;
  idempotencyKey?: string;
  ip?: string;
  userAgent?: string;
}) {
  const rl = rateLimit({
    key: `client-decide:${hashToken(input.rawToken).slice(0, 16)}`,
    limit: 10,
    windowMs: 60_000,
  });
  if (!rl.allowed) {
    throw new AppError("RATE_LIMITED", "Too many attempts. Please wait and try again.");
  }

  if (input.decision === "approved" && !input.confirmationAccepted) {
    throw new AppError(
      "VALIDATION_ERROR",
      "You must explicitly confirm acceptance before approving"
    );
  }

  await connectDb();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const proposal = await ChangeProposal.findOne({
      accessTokenHash: hashToken(input.rawToken),
    })
      .select("+accessTokenHash")
      .session(session);

    if (!proposal) throw new AppError("NOT_FOUND", "This link is invalid");
    if (proposal.accessTokenRevokedAt) throw new AppError("GONE", "This link has been revoked");
    if (isTokenExpired(proposal.accessTokenExpiresAt)) {
      throw new AppError("GONE", "This link has expired");
    }
    if (!DECIDABLE.has(proposal.status)) {
      throw new AppError(
        "CONFLICT",
        `This proposal cannot be decided in its current status (${proposal.status})`
      );
    }

    if (input.idempotencyKey) {
      const existing = await ProposalDecision.findOne({
        proposalId: proposal._id,
        idempotencyKey: input.idempotencyKey,
      }).session(session);
      if (existing) {
        await session.commitTransaction();
        return { proposal, decision: existing, duplicate: true };
      }
    }

    const updated = await ChangeProposal.findOneAndUpdate(
      {
        _id: proposal._id,
        status: { $in: Array.from(DECIDABLE) },
        accessTokenRevokedAt: null,
      },
      {
        $set: {
          status:
            input.decision === "clarification_requested"
              ? "clarification_requested"
              : input.decision === "approved"
                ? "approved"
                : "rejected",
          decidedAt: new Date(),
        },
      },
      { new: true, session }
    );

    if (!updated) {
      throw new AppError("CONFLICT", "This proposal was already decided");
    }

    const [decision] = await ProposalDecision.create(
      [
        {
          workspaceId: proposal.workspaceId,
          proposalId: proposal._id,
          proposalRevision: proposal.revision,
          decision: input.decision,
          comment: input.comment ?? "",
          clientNameEntered: input.clientNameEntered ?? "",
          confirmationAccepted: Boolean(input.confirmationAccepted),
          ipHash: input.ip ? createHash("sha256").update(input.ip).digest("hex") : null,
          userAgent: input.userAgent ?? null,
          idempotencyKey: input.idempotencyKey ?? null,
        },
      ],
      { session }
    );

    const request = await ClientRequest.findById(proposal.requestId).session(session);
    if (request) {
      const previousStatus = request.status;
      const next =
        input.decision === "approved"
          ? "approved"
          : input.decision === "rejected"
            ? "rejected"
            : "clarification_required";
      request.statusHistory.push({
        from: previousStatus,
        to: next,
        at: new Date(),
        byUserId: null,
        note: `Client ${input.decision}`,
      });
      request.status = next;
      await request.save({ session });
    }

    await session.commitTransaction();

    await createNotification({
      workspaceId: proposal.workspaceId,
      userId: proposal.createdById,
      type: `proposal_${input.decision}`,
      title: `Proposal ${input.decision.replace("_", " ")}`,
      body: `Client ${input.decision.replace(/_/g, " ")} proposal ${proposal.proposalNumber}.${input.comment ? ` Comment: ${input.comment}` : ""}`,
      href: `/app/projects/${proposal.projectId}/changes`,
      entityType: "change_proposal",
      entityId: proposal._id,
      dedupeKey: `decision:${proposal._id}:${proposal.revision}:${input.decision}`,
    });

    const project = await Project.findById(proposal.projectId);
    await enqueueJob({
      type: "send_email",
      idempotencyKey: `decision-email:${proposal._id}:${input.decision}`,
      payload: {
        to: (await Workspace.findById(proposal.workspaceId))?.billingEmail,
        template: "proposal_decision",
        data: {
          decision: input.decision,
          projectName: project?.name ?? "",
          comment: input.comment ?? "",
          href: `/app/projects/${proposal.projectId}/changes`,
        },
      },
    });

    await recordAudit({
      workspaceId: proposal.workspaceId,
      actorType: "client",
      eventType: `proposal.${input.decision}`,
      entityType: "change_proposal",
      entityId: proposal._id,
      summary: `Client ${input.decision} proposal ${proposal.proposalNumber}`,
      newValues: { decision: input.decision, revision: proposal.revision },
      ipHash: input.ip ? createHash("sha256").update(input.ip).digest("hex") : null,
    });

    return { proposal: updated, decision, duplicate: false };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

export async function withdrawProposal(input: {
  proposalId: string;
  workspaceId: string;
  userId: string;
}) {
  await connectDb();
  const proposal = await ChangeProposal.findOne({
    _id: input.proposalId,
    workspaceId: input.workspaceId,
  });
  if (!proposal) throw new AppError("NOT_FOUND", "Proposal not found");
  if (["approved", "rejected", "withdrawn"].includes(proposal.status)) {
    throw new AppError("CONFLICT", `Cannot withdraw a proposal that is ${proposal.status}`);
  }
  proposal.status = "withdrawn";
  proposal.accessTokenRevokedAt = new Date();
  await proposal.save();

  await recordAudit({
    workspaceId: input.workspaceId,
    actorUserId: input.userId,
    actorType: "user",
    eventType: "proposal.withdrawn",
    entityType: "change_proposal",
    entityId: proposal._id,
    summary: `Proposal ${proposal.proposalNumber} withdrawn`,
  });

  return proposal;
}

export async function markProposalWorkComplete(input: {
  proposalId: string;
  workspaceId: string;
  userId: string;
}) {
  await connectDb();
  const proposal = await ChangeProposal.findOne({
    _id: input.proposalId,
    workspaceId: input.workspaceId,
    status: "approved",
  });
  if (!proposal) throw new AppError("NOT_FOUND", "Approved proposal not found");
  proposal.workCompletedAt = new Date();
  await proposal.save();

  const request = await ClientRequest.findById(proposal.requestId);
  if (request) {
    request.status = "completed";
    request.completedAt = new Date();
    await request.save();
  }

  await recordAudit({
    workspaceId: input.workspaceId,
    actorUserId: input.userId,
    actorType: "user",
    eventType: "proposal.work_completed",
    entityType: "change_proposal",
    entityId: proposal._id,
    summary: `Additional work marked complete for ${proposal.proposalNumber}`,
  });

  return proposal;
}
