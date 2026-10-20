import { connectDb } from "@/lib/db/connection";
import { AppError } from "@/lib/errors";
import { recordAudit } from "@/lib/services/audit";
import { ClientRequest, Project } from "@/models";
import type { RequestPriority, RequestSource } from "@/models";

export async function createClientRequest(input: {
  workspaceId: string;
  userId: string;
  projectId: string;
  title: string;
  originalMessage?: string;
  description?: string;
  sourceChannel?: RequestSource;
  receivedAt?: Date;
  priority?: RequestPriority;
  internalNotes?: string;
  ownerId?: string | null;
}) {
  await connectDb();
  const project = await Project.findOne({
    _id: input.projectId,
    workspaceId: input.workspaceId,
    archivedAt: null,
  });
  if (!project) throw new AppError("NOT_FOUND", "Project not found");

  const request = await ClientRequest.create({
    workspaceId: input.workspaceId,
    projectId: project._id,
    clientId: project.clientId,
    title: input.title.trim(),
    originalMessage: input.originalMessage ?? "",
    description: input.description ?? "",
    sourceChannel: input.sourceChannel ?? "other",
    receivedAt: input.receivedAt ?? new Date(),
    priority: input.priority ?? "medium",
    status: "new",
    statusHistory: [
      {
        from: null,
        to: "new",
        at: new Date(),
        byUserId: input.userId,
        note: "Request recorded",
      },
    ],
    ownerId: input.ownerId ?? input.userId,
    internalNotes: input.internalNotes ?? "",
    createdById: input.userId,
  });

  await recordAudit({
    workspaceId: input.workspaceId,
    actorUserId: input.userId,
    actorType: "user",
    eventType: "request.created",
    entityType: "client_request",
    entityId: request._id,
    summary: `Request "${request.title}" recorded`,
  });

  return request;
}
