import { connectDb } from "@/lib/db/connection";
import { AppError } from "@/lib/errors";
import { getAiProvider } from "@/lib/providers/ai";
import { assertCanUseAi } from "@/lib/services/entitlements";
import { recordAudit } from "@/lib/services/audit";
import { createNotification } from "@/lib/services/notifications";
import {
  ChangeProposal,
  ClientRequest,
  Project,
  ScopeAnalysis,
  ScopeVersion,
  Workspace,
} from "@/models";
import { enqueueJob } from "@/lib/jobs/queue";

export async function createManualAnalysis(input: {
  workspaceId: string;
  requestId: string;
  userId: string;
  classification: "likely_included" | "potential_scope_change" | "unclear";
  explanation: string;
  relevantScopeItems?: string[];
  followUpQuestions?: string[];
  effortLowHours?: number | null;
  effortHighHours?: number | null;
  deadlineImpactDays?: number | null;
  suggestedClientResponse?: string;
}) {
  await connectDb();
  const request = await ClientRequest.findOne({
    _id: input.requestId,
    workspaceId: input.workspaceId,
  });
  if (!request) throw new AppError("NOT_FOUND", "Request not found");

  const project = await Project.findById(request.projectId);
  if (!project?.currentScopeVersionId) {
    throw new AppError("UNPROCESSABLE", "Add an original scope before analyzing requests");
  }

  const analysis = await ScopeAnalysis.create({
    workspaceId: input.workspaceId,
    projectId: request.projectId,
    requestId: request._id,
    scopeVersionId: project.currentScopeVersionId,
    mode: "manual",
    classification: input.classification,
    explanation: input.explanation,
    relevantScopeItems: input.relevantScopeItems ?? [],
    evidenceExcerpts: [],
    followUpQuestions: input.followUpQuestions ?? [],
    effortLowHours: input.effortLowHours ?? null,
    effortHighHours: input.effortHighHours ?? null,
    deadlineImpactDays: input.deadlineImpactDays ?? null,
    suggestedClientResponse: input.suggestedClientResponse ?? "",
    confidence: null,
    limitations: "Manual analysis — advisory only, not a legal determination.",
    insufficientEvidence: false,
    createdById: input.userId,
    confirmedById: input.userId,
    confirmedAt: new Date(),
  });

  const previousStatus = request.status;
  request.currentAnalysisId = analysis._id;
  request.status = "scope_analysis_complete";
  request.statusHistory.push({
    from: previousStatus,
    to: "scope_analysis_complete",
    at: new Date(),
    byUserId: input.userId as unknown as never,
    note: "Manual analysis saved",
  });
  await request.save();

  await recordAudit({
    workspaceId: input.workspaceId,
    actorUserId: input.userId,
    actorType: "user",
    eventType: "analysis.manual_created",
    entityType: "scope_analysis",
    entityId: analysis._id,
    summary: `Manual analysis: ${input.classification}`,
  });

  return analysis;
}

export async function requestAiAnalysis(input: {
  workspaceId: string;
  requestId: string;
  userId: string;
}) {
  await connectDb();
  const workspace = await Workspace.findById(input.workspaceId);
  if (!workspace) throw new AppError("NOT_FOUND", "Workspace not found");
  assertCanUseAi(workspace);

  const request = await ClientRequest.findOne({
    _id: input.requestId,
    workspaceId: input.workspaceId,
  });
  if (!request) throw new AppError("NOT_FOUND", "Request not found");

  const project = await Project.findById(request.projectId);
  if (!project?.currentScopeVersionId) {
    throw new AppError("UNPROCESSABLE", "Add an original scope before analyzing requests");
  }

  const placeholder = await ScopeAnalysis.create({
    workspaceId: input.workspaceId,
    projectId: request.projectId,
    requestId: request._id,
    scopeVersionId: project.currentScopeVersionId,
    mode: "ai",
    classification: "unclear",
    explanation: "Analysis in progress…",
    relevantScopeItems: [],
    evidenceExcerpts: [],
    followUpQuestions: [],
    limitations: "Pending AI provider response",
    insufficientEvidence: true,
    provider: "openai",
    createdById: input.userId,
  });

  request.currentAnalysisId = placeholder._id;
  request.status = "needs_review";
  await request.save();

  await enqueueJob({
    type: "ai_analysis",
    idempotencyKey: `ai-analysis:${placeholder._id}`,
    payload: {
      analysisId: String(placeholder._id),
      requestId: String(request._id),
      workspaceId: input.workspaceId,
      userId: input.userId,
    },
  });

  return placeholder;
}

export async function runAiAnalysisJob(input: {
  analysisId: string;
  requestId: string;
  workspaceId: string;
  userId: string;
}) {
  await connectDb();
  const analysis = await ScopeAnalysis.findById(input.analysisId);
  const request = await ClientRequest.findById(input.requestId);
  if (!analysis || !request) return;

  const project = await Project.findById(request.projectId);
  const scope = project?.currentScopeVersionId
    ? await ScopeVersion.findById(project.currentScopeVersionId)
    : null;

  const approved = await ChangeProposal.find({
    projectId: request.projectId,
    status: "approved",
  })
    .select("title additionalWorkDescription totalMinor")
    .limit(20)
    .lean();

  const provider = getAiProvider();
  const result = await provider.analyzeScope({
    projectName: project?.name ?? "Project",
    requestTitle: request.title,
    requestMessage: request.originalMessage,
    requestDescription: request.description,
    scopeSummary: buildScopeSummary(scope),
    exclusions: scope?.exclusions ?? [],
    approvedChangesSummary: approved
      .map((p) => `${p.title}: ${p.additionalWorkDescription}`)
      .join("\n"),
    clarifications: [],
  });

  analysis.classification = result.classification;
  analysis.explanation = result.explanation;
  analysis.relevantScopeItems = result.relevantScopeItems;
  analysis.evidenceExcerpts = result.evidenceExcerpts;
  analysis.followUpQuestions = result.followUpQuestions;
  analysis.effortLowHours = result.effortLowHours ?? null;
  analysis.effortHighHours = result.effortHighHours ?? null;
  analysis.deadlineImpactDays = result.deadlineImpactDays ?? null;
  analysis.suggestedClientResponse = result.suggestedClientResponse;
  analysis.confidence = result.confidence ?? null;
  analysis.limitations =
    result.limitations ||
    "AI analysis is advisory only and not a legal determination. Confirm before pricing or sending.";
  analysis.insufficientEvidence = result.insufficientEvidence;
  analysis.modelName = process.env.OPENAI_MODEL ?? null;
  await analysis.save();

  request.status = "scope_analysis_complete";
  request.statusHistory.push({
    from: "needs_review",
    to: "scope_analysis_complete",
    at: new Date(),
    byUserId: input.userId as unknown as never,
    note: "AI analysis completed",
  });
  await request.save();

  await createNotification({
    workspaceId: input.workspaceId,
    userId: input.userId,
    type: "ai_analysis_completed",
    title: "AI analysis ready",
    body: `Analysis for “${request.title}” is ready for your review.`,
    href: `/app/projects/${request.projectId}/requests/${request._id}`,
    entityType: "client_request",
    entityId: request._id,
    dedupeKey: `ai-done:${analysis._id}`,
  });

  await recordAudit({
    workspaceId: input.workspaceId,
    actorUserId: input.userId,
    actorType: "system",
    eventType: "analysis.ai_completed",
    entityType: "scope_analysis",
    entityId: analysis._id,
    summary: `AI analysis: ${result.classification}`,
  });
}

function buildScopeSummary(scope: InstanceType<typeof ScopeVersion> | null): string {
  if (!scope) return "";
  return [
    `Objectives: ${scope.objectives}`,
    `Deliverables: ${(scope.deliverables ?? []).join("; ")}`,
    `Features: ${(scope.features ?? []).join("; ")}`,
    `Included: ${(scope.includedFunctionality ?? []).join("; ")}`,
    `Exclusions: ${(scope.exclusions ?? []).join("; ")}`,
    `Revisions: ${scope.includedRevisions}`,
    `Additional work policy: ${scope.additionalWorkPolicy}`,
    scope.rawPastedText ? `Agreement excerpt: ${scope.rawPastedText.slice(0, 3000)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
