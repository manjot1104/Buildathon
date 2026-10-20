import { z } from "zod";
import { jsonCreated, jsonOk, jsonError } from "@/lib/api/response";
import { requireAuthWorkspace } from "@/lib/api/workspace";
import { assertObjectId } from "@/lib/auth/authorization";
import { createScopeVersion } from "@/lib/services/project-service";
import { connectDb } from "@/lib/db/connection";
import { AppError } from "@/lib/errors";
import { Project, ScopeVersion } from "@/models";
import { toMinor } from "@/lib/money";

export const dynamic = "force-dynamic";

type Ctx = { params: { projectId: string } };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { workspace } = await requireAuthWorkspace();
    assertObjectId(params.projectId, "Project");
    await connectDb();
    const project = await Project.findOne({
      _id: params.projectId,
      workspaceId: workspace.workspaceId,
    });
    if (!project) throw new AppError("NOT_FOUND", "Project not found");

    const versions = await ScopeVersion.find({
      projectId: project._id,
      workspaceId: workspace.workspaceId,
    })
      .sort({ versionNumber: -1 })
      .lean();

    return jsonOk({
      currentScopeVersionId: project.currentScopeVersionId
        ? String(project.currentScopeVersionId)
        : null,
      versions: versions.map((v) => ({
        id: String(v._id),
        versionNumber: v.versionNumber,
        label: v.label,
        isCurrent: v.isCurrent,
        objectives: v.objectives,
        deliverables: v.deliverables,
        features: v.features,
        includedFunctionality: v.includedFunctionality,
        exclusions: v.exclusions,
        includedRevisions: v.includedRevisions,
        paymentTerms: v.paymentTerms,
        additionalWorkPolicy: v.additionalWorkPolicy,
        agreedBudgetMinor: v.agreedBudgetMinor,
        rawPastedText: v.rawPastedText,
        extractionNotes: v.extractionNotes,
        createdAt: v.createdAt,
      })),
    });
  } catch (err) {
    return jsonError(err);
  }
}

const schema = z.object({
  label: z.string().optional(),
  objectives: z.string().optional(),
  deliverables: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
  includedFunctionality: z.array(z.string()).optional(),
  exclusions: z.array(z.string()).optional(),
  includedRevisions: z.number().int().nonnegative().optional(),
  deliveryDates: z.string().optional(),
  agreedBudget: z.number().nonnegative().optional(),
  paymentTerms: z.string().optional(),
  additionalWorkPolicy: z.string().optional(),
  rawPastedText: z.string().optional(),
  extractionNotes: z.string().optional(),
});

export async function POST(req: Request, { params }: Ctx) {
  try {
    const { session, workspace } = await requireAuthWorkspace();
    assertObjectId(params.projectId, "Project");
    const body = schema.parse(await req.json());
    const scope = await createScopeVersion({
      workspaceId: workspace.workspaceId,
      projectId: params.projectId,
      userId: session.user.id,
      ...body,
      agreedBudgetMinor:
        body.agreedBudget !== undefined ? toMinor(body.agreedBudget) : undefined,
    });
    return jsonCreated({
      id: String(scope._id),
      versionNumber: scope.versionNumber,
      isCurrent: scope.isCurrent,
    });
  } catch (err) {
    return jsonError(err);
  }
}
