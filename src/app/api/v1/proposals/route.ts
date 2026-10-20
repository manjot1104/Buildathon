import { z } from "zod";
import { jsonCreated, jsonOk, jsonError } from "@/lib/api/response";
import { requireAuthWorkspace } from "@/lib/api/workspace";
import { createProposalDraft } from "@/lib/services/proposal-service";
import { connectDb } from "@/lib/db/connection";
import { ChangeProposal } from "@/models";
import { toMinor } from "@/lib/money";
import { requireCanSendProposals } from "@/lib/auth/authorization";

export async function GET(req: Request) {
  try {
    const { workspace } = await requireAuthWorkspace();
    await connectDb();
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const projectId = url.searchParams.get("projectId");
    const filter: Record<string, unknown> = { workspaceId: workspace.workspaceId };
    if (status) filter.status = status;
    if (projectId) filter.projectId = projectId;

    const items = await ChangeProposal.find(filter).sort({ updatedAt: -1 }).limit(100).lean();
    return jsonOk({
      items: items.map((p) => ({
        id: String(p._id),
        proposalNumber: p.proposalNumber,
        title: p.title,
        status: p.status,
        totalMinor: p.totalMinor,
        currency: p.currency,
        projectId: String(p.projectId),
        requestId: String(p.requestId),
        sentAt: p.sentAt,
        decidedAt: p.decidedAt,
        workCompletedAt: p.workCompletedAt,
      })),
    });
  } catch (err) {
    return jsonError(err);
  }
}

const lineSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().nonnegative(),
  unit: z.string().min(1),
  rate: z.number().nonnegative(),
});

const schema = z.object({
  requestId: z.string().min(1),
  title: z.string().min(1).max(300),
  lineItems: z.array(lineSchema).min(1),
  discount: z.number().nonnegative().optional(),
  fees: z.number().nonnegative().optional(),
  taxRateBps: z.number().int().nonnegative().optional(),
  additionalWorkingDays: z.number().int().nonnegative().optional(),
  proposedDeadline: z.string().datetime().nullable().optional(),
  deadlineExplanation: z.string().optional(),
  paymentTerms: z.string().optional(),
  whySeparate: z.string().optional(),
  deliverables: z.array(z.string()).optional(),
  exclusions: z.array(z.string()).optional(),
  assumptions: z.array(z.string()).optional(),
  additionalWorkDescription: z.string().optional(),
  milestoneImpact: z.string().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

export async function POST(req: Request) {
  try {
    const { session, workspace } = await requireAuthWorkspace();
    await requireCanSendProposals(session, workspace.workspaceId);
    const body = schema.parse(await req.json());
    const proposal = await createProposalDraft({
      workspaceId: workspace.workspaceId,
      requestId: body.requestId,
      userId: session.user.id,
      title: body.title,
      lineItems: body.lineItems.map((l) => ({
        description: l.description,
        quantity: l.quantity,
        unit: l.unit,
        rateMinor: toMinor(l.rate),
      })),
      discountMinor: body.discount !== undefined ? toMinor(body.discount) : 0,
      feesMinor: body.fees !== undefined ? toMinor(body.fees) : 0,
      taxRateBps: body.taxRateBps,
      additionalWorkingDays: body.additionalWorkingDays,
      proposedDeadline: body.proposedDeadline ? new Date(body.proposedDeadline) : null,
      deadlineExplanation: body.deadlineExplanation,
      paymentTerms: body.paymentTerms,
      whySeparate: body.whySeparate,
      deliverables: body.deliverables,
      exclusions: body.exclusions,
      assumptions: body.assumptions,
      additionalWorkDescription: body.additionalWorkDescription,
      milestoneImpact: body.milestoneImpact,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    });
    return jsonCreated({
      id: String(proposal._id),
      proposalNumber: proposal.proposalNumber,
      status: proposal.status,
      totalMinor: proposal.totalMinor,
      currency: proposal.currency,
    });
  } catch (err) {
    return jsonError(err);
  }
}
