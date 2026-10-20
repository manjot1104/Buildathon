import { jsonOk, jsonError } from "@/lib/api/response";
import { requireAuthWorkspace } from "@/lib/api/workspace";
import { assertObjectId } from "@/lib/auth/authorization";
import { connectDb } from "@/lib/db/connection";
import { AppError } from "@/lib/errors";
import { ChangeProposal, ClientRequest, ScopeAnalysis } from "@/models";

type Ctx = { params: { requestId: string } };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { workspace } = await requireAuthWorkspace();
    assertObjectId(params.requestId, "Request");
    await connectDb();
    const request = await ClientRequest.findOne({
      _id: params.requestId,
      workspaceId: workspace.workspaceId,
    }).lean();
    if (!request) throw new AppError("NOT_FOUND", "Request not found");

    const [analysis, proposals] = await Promise.all([
      request.currentAnalysisId
        ? ScopeAnalysis.findById(request.currentAnalysisId).lean()
        : ScopeAnalysis.findOne({ requestId: request._id }).sort({ createdAt: -1 }).lean(),
      ChangeProposal.find({ requestId: request._id }).sort({ createdAt: -1 }).lean(),
    ]);

    return jsonOk({
      id: String(request._id),
      projectId: String(request.projectId),
      title: request.title,
      originalMessage: request.originalMessage,
      description: request.description,
      sourceChannel: request.sourceChannel,
      receivedAt: request.receivedAt,
      priority: request.priority,
      status: request.status,
      statusHistory: request.statusHistory,
      internalNotes: request.internalNotes,
      analysis: analysis
        ? {
            id: String(analysis._id),
            mode: analysis.mode,
            classification: analysis.classification,
            explanation: analysis.explanation,
            relevantScopeItems: analysis.relevantScopeItems,
            evidenceExcerpts: analysis.evidenceExcerpts,
            followUpQuestions: analysis.followUpQuestions,
            effortLowHours: analysis.effortLowHours,
            effortHighHours: analysis.effortHighHours,
            deadlineImpactDays: analysis.deadlineImpactDays,
            suggestedClientResponse: analysis.suggestedClientResponse,
            confidence: analysis.confidence,
            limitations: analysis.limitations,
            insufficientEvidence: analysis.insufficientEvidence,
          }
        : null,
      proposals: proposals.map((p) => ({
        id: String(p._id),
        proposalNumber: p.proposalNumber,
        status: p.status,
        totalMinor: p.totalMinor,
        currency: p.currency,
        revision: p.revision,
      })),
    });
  } catch (err) {
    return jsonError(err);
  }
}
