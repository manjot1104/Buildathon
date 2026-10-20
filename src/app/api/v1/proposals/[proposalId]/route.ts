import { jsonOk, jsonError } from "@/lib/api/response";
import { requireAuthWorkspace } from "@/lib/api/workspace";
import { assertObjectId } from "@/lib/auth/authorization";
import { connectDb } from "@/lib/db/connection";
import { AppError } from "@/lib/errors";
import {
  markProposalWorkComplete,
  withdrawProposal,
} from "@/lib/services/proposal-service";
import { ChangeProposal, ProposalDecision } from "@/models";
import { z } from "zod";

type Ctx = { params: { proposalId: string } };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { workspace } = await requireAuthWorkspace();
    assertObjectId(params.proposalId, "Proposal");
    await connectDb();
    const proposal = await ChangeProposal.findOne({
      _id: params.proposalId,
      workspaceId: workspace.workspaceId,
    }).lean();
    if (!proposal) throw new AppError("NOT_FOUND", "Proposal not found");
    const decisions = await ProposalDecision.find({ proposalId: proposal._id })
      .sort({ createdAt: -1 })
      .lean();
    return jsonOk({
      id: String(proposal._id),
      ...proposal,
      _id: undefined,
      decisions,
    });
  } catch (err) {
    return jsonError(err);
  }
}

const actionSchema = z.object({
  action: z.enum(["withdraw", "mark_complete"]),
});

export async function POST(req: Request, { params }: Ctx) {
  try {
    const { session, workspace } = await requireAuthWorkspace();
    assertObjectId(params.proposalId, "Proposal");
    const body = actionSchema.parse(await req.json());
    if (body.action === "withdraw") {
      const proposal = await withdrawProposal({
        proposalId: params.proposalId,
        workspaceId: workspace.workspaceId,
        userId: session.user.id,
      });
      return jsonOk({ id: String(proposal._id), status: proposal.status });
    }
    const proposal = await markProposalWorkComplete({
      proposalId: params.proposalId,
      workspaceId: workspace.workspaceId,
      userId: session.user.id,
    });
    return jsonOk({
      id: String(proposal._id),
      workCompletedAt: proposal.workCompletedAt,
    });
  } catch (err) {
    return jsonError(err);
  }
}
