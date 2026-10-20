import { z } from "zod";
import { jsonCreated, jsonOk, jsonError } from "@/lib/api/response";
import { requireAuthWorkspace } from "@/lib/api/workspace";
import { createProject } from "@/lib/services/project-service";
import { connectDb } from "@/lib/db/connection";
import { Client, Project } from "@/models";
import { toMinor } from "@/lib/money";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { workspace } = await requireAuthWorkspace();
    await connectDb();
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const status = url.searchParams.get("status");
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? 20)));

    const filter: Record<string, unknown> = {
      workspaceId: workspace.workspaceId,
      archivedAt: null,
    };
    if (status) filter.status = status;
    if (q) filter.$text = { $search: q };

    const [items, total] = await Promise.all([
      Project.find(filter)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("clientId", "name email company")
        .lean(),
      Project.countDocuments(filter),
    ]);

    return jsonOk({
      items: items.map(serializeProject),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    return jsonError(err);
  }
}

const createSchema = z.object({
  clientId: z.string().min(1),
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  status: z.enum(["draft", "active", "on_hold", "completed", "archived"]).optional(),
  startDate: z.string().datetime().nullable().optional(),
  deadline: z.string().datetime().nullable().optional(),
  currency: z.string().length(3).optional(),
  originalPrice: z.number().nonnegative().optional(),
  pricingModel: z.enum(["fixed", "hourly", "milestone"]).optional(),
  defaultHourlyRate: z.number().nonnegative().optional(),
  estimatedOriginalHours: z.number().nonnegative().nullable().optional(),
  includedRevisions: z.number().int().nonnegative().optional(),
  revisionPolicy: z.string().optional(),
  communicationMethod: z.string().optional(),
  exclusionsSummary: z.string().optional(),
  internalNotes: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const { session, workspace } = await requireAuthWorkspace();
    const body = createSchema.parse(await req.json());
    const project = await createProject({
      workspaceId: workspace.workspaceId,
      userId: session.user.id,
      clientId: body.clientId,
      name: body.name,
      description: body.description,
      status: body.status,
      startDate: body.startDate ? new Date(body.startDate) : null,
      deadline: body.deadline ? new Date(body.deadline) : null,
      currency: body.currency,
      originalPriceMinor:
        body.originalPrice !== undefined ? toMinor(body.originalPrice) : 0,
      pricingModel: body.pricingModel,
      defaultHourlyRateMinor:
        body.defaultHourlyRate !== undefined ? toMinor(body.defaultHourlyRate) : undefined,
      estimatedOriginalHours: body.estimatedOriginalHours,
      includedRevisions: body.includedRevisions,
      revisionPolicy: body.revisionPolicy,
      communicationMethod: body.communicationMethod,
      exclusionsSummary: body.exclusionsSummary,
      internalNotes: body.internalNotes,
    });
    const client = await Client.findById(project.clientId).lean();
    return jsonCreated({
      ...serializeProject(project.toObject()),
      client: client
        ? { id: String(client._id), name: client.name, email: client.email }
        : null,
    });
  } catch (err) {
    return jsonError(err);
  }
}

function serializeProject(p: Record<string, unknown>) {
  const client = p.clientId as { _id?: { toString(): string }; name?: string } | string;
  return {
    id: String(p._id),
    name: p.name,
    description: p.description,
    status: p.status,
    currency: p.currency,
    originalPriceMinor: p.originalPriceMinor,
    pricingModel: p.pricingModel,
    deadline: p.deadline,
    startDate: p.startDate,
    currentScopeVersionId: p.currentScopeVersionId
      ? String(p.currentScopeVersionId)
      : null,
    clientId:
      typeof client === "object" && client?._id
        ? String(client._id)
        : String(p.clientId),
    client:
      typeof client === "object" && client?.name
        ? { id: String(client._id), name: client.name }
        : undefined,
    updatedAt: p.updatedAt,
    createdAt: p.createdAt,
  };
}
