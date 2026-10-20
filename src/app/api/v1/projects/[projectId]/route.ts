import { z } from "zod";
import { jsonOk, jsonError } from "@/lib/api/response";
import { requireAuthWorkspace } from "@/lib/api/workspace";
import { assertObjectId } from "@/lib/auth/authorization";
import { connectDb } from "@/lib/db/connection";
import { AppError } from "@/lib/errors";
import { Client, ClientRequest, ChangeProposal, Project, ScopeVersion } from "@/models";
import { recordAudit } from "@/lib/services/audit";

type Ctx = { params: { projectId: string } };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { workspace } = await requireAuthWorkspace();
    assertObjectId(params.projectId, "Project");
    await connectDb();
    const project = await Project.findOne({
      _id: params.projectId,
      workspaceId: workspace.workspaceId,
    }).lean();
    if (!project) throw new AppError("NOT_FOUND", "Project not found");

    const [client, scope, requestCounts, proposalCounts] = await Promise.all([
      Client.findById(project.clientId).lean(),
      project.currentScopeVersionId
        ? ScopeVersion.findById(project.currentScopeVersionId).lean()
        : null,
      ClientRequest.aggregate([
        { $match: { projectId: project._id } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      ChangeProposal.aggregate([
        { $match: { projectId: project._id } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    return jsonOk({
      id: String(project._id),
      ...project,
      _id: undefined,
      client: client
        ? { id: String(client._id), name: client.name, email: client.email, company: client.company }
        : null,
      scope: scope
        ? {
            id: String(scope._id),
            versionNumber: scope.versionNumber,
            objectives: scope.objectives,
            deliverables: scope.deliverables,
            features: scope.features,
            exclusions: scope.exclusions,
            includedRevisions: scope.includedRevisions,
            paymentTerms: scope.paymentTerms,
            additionalWorkPolicy: scope.additionalWorkPolicy,
          }
        : null,
      requestCounts,
      proposalCounts,
    });
  } catch (err) {
    return jsonError(err);
  }
}

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(["draft", "active", "on_hold", "completed", "archived"]).optional(),
  deadline: z.string().datetime().nullable().optional(),
  startDate: z.string().datetime().nullable().optional(),
  internalNotes: z.string().optional(),
  revisionPolicy: z.string().optional(),
  communicationMethod: z.string().optional(),
  exclusionsSummary: z.string().optional(),
  includedRevisions: z.number().int().nonnegative().optional(),
});

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { session, workspace } = await requireAuthWorkspace();
    assertObjectId(params.projectId, "Project");
    const body = patchSchema.parse(await req.json());
    await connectDb();
    const project = await Project.findOne({
      _id: params.projectId,
      workspaceId: workspace.workspaceId,
    });
    if (!project) throw new AppError("NOT_FOUND", "Project not found");

    const prev = { status: project.status, name: project.name };
    if (body.name) project.name = body.name;
    if (body.description !== undefined) project.description = body.description;
    if (body.status) {
      project.status = body.status;
      if (body.status === "archived") project.archivedAt = new Date();
    }
    if (body.deadline !== undefined)
      project.deadline = body.deadline ? new Date(body.deadline) : null;
    if (body.startDate !== undefined)
      project.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.internalNotes !== undefined) project.internalNotes = body.internalNotes;
    if (body.revisionPolicy !== undefined) project.revisionPolicy = body.revisionPolicy;
    if (body.communicationMethod !== undefined)
      project.communicationMethod = body.communicationMethod;
    if (body.exclusionsSummary !== undefined)
      project.exclusionsSummary = body.exclusionsSummary;
    if (body.includedRevisions !== undefined)
      project.includedRevisions = body.includedRevisions;

    await project.save();
    await recordAudit({
      workspaceId: workspace.workspaceId,
      actorUserId: session.user.id,
      actorType: "user",
      eventType: "project.updated",
      entityType: "project",
      entityId: project._id,
      summary: `Project "${project.name}" updated`,
      previousValues: prev,
      newValues: { status: project.status, name: project.name },
    });

    return jsonOk({ id: String(project._id), status: project.status, name: project.name });
  } catch (err) {
    return jsonError(err);
  }
}
