import { z } from "zod";
import { jsonOk, jsonError } from "@/lib/api/response";
import {
  decideProposal,
  getProposalByAccessToken,
  recordProposalView,
} from "@/lib/services/proposal-service";
import { formatMoney } from "@/lib/money";
import { rateLimit } from "@/lib/security/rate-limit";
import { AppError } from "@/lib/errors";
import { generateProposalPdf } from "@/lib/pdf/proposal-pdf";
import { ProposalDecision } from "@/models";
import { connectDb } from "@/lib/db/connection";

type Ctx = { params: { token: string } };

export async function GET(req: Request, { params }: Ctx) {
  try {
    const rl = rateLimit({
      key: `client-view:${params.token.slice(0, 12)}`,
      limit: 30,
      windowMs: 60_000,
    });
    if (!rl.allowed) throw new AppError("RATE_LIMITED", "Too many requests");

    const url = new URL(req.url);
    if (url.searchParams.get("download") === "pdf") {
      const proposal = await getProposalByAccessToken(params.token);
      await connectDb();
      const decision = await ProposalDecision.findOne({ proposalId: proposal._id }).sort({
        createdAt: -1,
      });
      const snap = proposal.sentSnapshot;
      if (!snap) throw new AppError("UNPROCESSABLE", "Proposal snapshot not available");
      const pdf = await generateProposalPdf({
        proposalNumber: proposal.proposalNumber,
        revision: proposal.revision,
        workspaceName: snap.workspaceName ?? "",
        clientName: snap.clientName ?? "",
        projectName: snap.projectName ?? "",
        title: proposal.title,
        additionalWorkDescription: snap.additionalWorkDescription ?? "",
        whySeparate: snap.whySeparate ?? "",
        deliverables: (snap.deliverables as string[]) ?? [],
        exclusions: (snap.exclusions as string[]) ?? [],
        lineItems: (snap.lineItems as never) ?? [],
        subtotalMinor: snap.subtotalMinor ?? 0,
        discountMinor: snap.discountMinor ?? 0,
        feesMinor: snap.feesMinor ?? 0,
        taxMinor: snap.taxMinor ?? 0,
        totalMinor: snap.totalMinor ?? 0,
        currency: snap.currency ?? proposal.currency,
        additionalWorkingDays: snap.additionalWorkingDays ?? 0,
        originalDeadline: (snap.originalDeadline as Date) ?? null,
        proposedDeadline: (snap.proposedDeadline as Date) ?? null,
        paymentTerms: snap.paymentTerms ?? "",
        scopeExcerpt: (snap.scopeExcerpt as string) ?? "",
        createdAt: proposal.createdAt,
        expiresAt: proposal.expiresAt ?? null,
        decision: decision
          ? {
              decision: decision.decision,
              at: decision.createdAt,
              clientNameEntered: decision.clientNameEntered ?? undefined,
            }
          : undefined,
      });
      return new Response(new Uint8Array(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${proposal.proposalNumber}.pdf"`,
        },
      });
    }

    const proposal = await recordProposalView(params.token, {
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
      ua: req.headers.get("user-agent") ?? undefined,
    });
    const snap = proposal.sentSnapshot;
    if (!snap) throw new AppError("UNPROCESSABLE", "Proposal is not available for viewing");

    return jsonOk({
      proposalNumber: proposal.proposalNumber,
      revision: proposal.revision,
      status: proposal.status,
      title: proposal.title,
      workspaceName: snap.workspaceName,
      clientName: snap.clientName,
      projectName: snap.projectName,
      requestSummary: snap.requestSummary,
      additionalWorkDescription: snap.additionalWorkDescription,
      whySeparate: snap.whySeparate,
      deliverables: snap.deliverables,
      exclusions: snap.exclusions,
      assumptions: snap.assumptions,
      lineItems: snap.lineItems,
      subtotal: formatMoney(snap.subtotalMinor ?? 0, snap.currency ?? "INR"),
      tax: formatMoney(snap.taxMinor ?? 0, snap.currency ?? "INR"),
      total: formatMoney(snap.totalMinor ?? 0, snap.currency ?? "INR"),
      totalMinor: snap.totalMinor,
      currency: snap.currency,
      additionalWorkingDays: snap.additionalWorkingDays,
      originalDeadline: snap.originalDeadline,
      proposedDeadline: snap.proposedDeadline,
      deadlineExplanation: snap.deadlineExplanation,
      paymentTerms: snap.paymentTerms,
      scopeExcerpt: snap.scopeExcerpt,
      expiresAt: proposal.expiresAt,
      decidedAt: proposal.decidedAt,
      legalNotice:
        "Electronic acceptance creates a documented record. Legal enforceability may vary by jurisdiction and is not guaranteed by this tool.",
    });
  } catch (err) {
    return jsonError(err);
  }
}

const decideSchema = z.object({
  decision: z.enum(["approved", "rejected", "clarification_requested"]),
  comment: z.string().max(5000).optional(),
  clientNameEntered: z.string().max(200).optional(),
  confirmationAccepted: z.boolean().optional(),
  idempotencyKey: z.string().max(120).optional(),
});

export async function POST(req: Request, { params }: Ctx) {
  try {
    const body = decideSchema.parse(await req.json());
    const result = await decideProposal({
      rawToken: params.token,
      decision: body.decision,
      comment: body.comment,
      clientNameEntered: body.clientNameEntered,
      confirmationAccepted: body.confirmationAccepted,
      idempotencyKey: body.idempotencyKey ?? req.headers.get("idempotency-key") ?? undefined,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });
    return jsonOk({
      status: result.proposal.status,
      decision: result.decision.decision,
      duplicate: result.duplicate,
      message:
        result.decision.decision === "approved"
          ? "Thank you. Your approval has been recorded."
          : result.decision.decision === "rejected"
            ? "Your rejection has been recorded."
            : "Your clarification request has been sent.",
    });
  } catch (err) {
    return jsonError(err);
  }
}
