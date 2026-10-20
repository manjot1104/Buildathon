import { requireAuthWorkspace } from "@/lib/api/workspace";
import { assertObjectId } from "@/lib/auth/authorization";
import { connectDb } from "@/lib/db/connection";
import { AppError } from "@/lib/errors";
import { jsonError } from "@/lib/api/response";
import { generateProposalPdf } from "@/lib/pdf/proposal-pdf";
import { ChangeProposal, ProposalDecision } from "@/models";

type Ctx = { params: { proposalId: string } };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { workspace } = await requireAuthWorkspace();
    assertObjectId(params.proposalId, "Proposal");
    await connectDb();
    const proposal = await ChangeProposal.findOne({
      _id: params.proposalId,
      workspaceId: workspace.workspaceId,
    });
    if (!proposal) throw new AppError("NOT_FOUND", "Proposal not found");

    const snap = proposal.sentSnapshot;
    const decision = await ProposalDecision.findOne({
      proposalId: proposal._id,
      decision: "approved",
    }).sort({ createdAt: -1 });

    const pdf = await generateProposalPdf({
      proposalNumber: proposal.proposalNumber,
      revision: proposal.revision,
      workspaceName: snap?.workspaceName ?? "Workspace",
      clientName: snap?.clientName ?? "Client",
      projectName: snap?.projectName ?? "Project",
      title: proposal.title,
      additionalWorkDescription:
        snap?.additionalWorkDescription ?? proposal.additionalWorkDescription,
      whySeparate: snap?.whySeparate ?? proposal.whySeparate,
      deliverables: (snap?.deliverables as string[]) ?? proposal.deliverables ?? [],
      exclusions: (snap?.exclusions as string[]) ?? proposal.exclusions ?? [],
      lineItems: (snap?.lineItems as typeof proposal.lineItems) ?? proposal.lineItems,
      subtotalMinor: snap?.subtotalMinor ?? proposal.subtotalMinor,
      discountMinor: snap?.discountMinor ?? proposal.discountMinor,
      feesMinor: snap?.feesMinor ?? proposal.feesMinor,
      taxMinor: snap?.taxMinor ?? proposal.taxMinor,
      totalMinor: snap?.totalMinor ?? proposal.totalMinor,
      currency: snap?.currency ?? proposal.currency,
      additionalWorkingDays:
        snap?.additionalWorkingDays ?? proposal.additionalWorkingDays,
      originalDeadline:
        (snap?.originalDeadline as Date | undefined) ?? proposal.originalDeadline ?? null,
      proposedDeadline:
        (snap?.proposedDeadline as Date | undefined) ?? proposal.proposedDeadline ?? null,
      paymentTerms: snap?.paymentTerms ?? proposal.paymentTerms,
      scopeExcerpt: (snap?.scopeExcerpt as string) ?? "",
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
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${proposal.proposalNumber}.pdf"`,
      },
    });
  } catch (err) {
    return jsonError(err);
  }
}
