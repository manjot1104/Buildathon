import { z } from "zod";
import { jsonCreated, jsonOk, jsonError } from "@/lib/api/response";
import { requireAuthWorkspace } from "@/lib/api/workspace";
import { assertObjectId } from "@/lib/auth/authorization";
import { createClientRequest } from "@/lib/services/request-service";
import { connectDb } from "@/lib/db/connection";
import { ClientRequest } from "@/models";
import { REQUEST_PRIORITIES, REQUEST_SOURCES } from "@/models/enums";

export const dynamic = "force-dynamic";

type Ctx = { params: { projectId: string } };

export async function GET(req: Request, { params }: Ctx) {
  try {
    const { workspace } = await requireAuthWorkspace();
    assertObjectId(params.projectId, "Project");
    await connectDb();
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const filter: Record<string, unknown> = {
      workspaceId: workspace.workspaceId,
      projectId: params.projectId,
    };
    if (status) filter.status = status;

    const items = await ClientRequest.find(filter).sort({ updatedAt: -1 }).limit(100).lean();
    return jsonOk({
      items: items.map((r) => ({
        id: String(r._id),
        title: r.title,
        status: r.status,
        priority: r.priority,
        sourceChannel: r.sourceChannel,
        receivedAt: r.receivedAt,
        updatedAt: r.updatedAt,
        currentProposalId: r.currentProposalId ? String(r.currentProposalId) : null,
      })),
    });
  } catch (err) {
    return jsonError(err);
  }
}

const schema = z.object({
  title: z.string().min(1).max(300),
  originalMessage: z.string().max(20000).optional(),
  description: z.string().max(10000).optional(),
  sourceChannel: z.enum(REQUEST_SOURCES).optional(),
  receivedAt: z.string().datetime().optional(),
  priority: z.enum(REQUEST_PRIORITIES).optional(),
  internalNotes: z.string().max(10000).optional(),
});

export async function POST(req: Request, { params }: Ctx) {
  try {
    const { session, workspace } = await requireAuthWorkspace();
    assertObjectId(params.projectId, "Project");
    const body = schema.parse(await req.json());
    const request = await createClientRequest({
      workspaceId: workspace.workspaceId,
      userId: session.user.id,
      projectId: params.projectId,
      title: body.title,
      originalMessage: body.originalMessage,
      description: body.description,
      sourceChannel: body.sourceChannel,
      receivedAt: body.receivedAt ? new Date(body.receivedAt) : undefined,
      priority: body.priority,
      internalNotes: body.internalNotes,
    });
    return jsonCreated({
      id: String(request._id),
      title: request.title,
      status: request.status,
    });
  } catch (err) {
    return jsonError(err);
  }
}
