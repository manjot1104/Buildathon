import { jsonOk, jsonError } from "@/lib/api/response";
import { requireAuthWorkspace } from "@/lib/api/workspace";
import { assertObjectId, requireCanSendProposals } from "@/lib/auth/authorization";
import { sendProposal } from "@/lib/services/proposal-service";

export const dynamic = "force-dynamic";

type Ctx = { params: { proposalId: string } };

export async function POST(_req: Request, { params }: Ctx) {
  try {
    const { session, workspace } = await requireAuthWorkspace();
    assertObjectId(params.proposalId, "Proposal");
    await requireCanSendProposals(session, workspace.workspaceId);
    const { proposal, approveUrl } = await sendProposal({
      proposalId: params.proposalId,
      workspaceId: workspace.workspaceId,
      userId: session.user.id,
    });
    return jsonOk({
      id: String(proposal._id),
      status: proposal.status,
      approveUrl,
      message:
        "Proposal sent. Share the approval link with your client if email is not configured.",
    });
  } catch (err) {
    return jsonError(err);
  }
}
