import { connectDb } from "@/lib/db/connection";
import { AuditEvent } from "@/models";
import type { Types } from "mongoose";

export async function recordAudit(input: {
  workspaceId?: string | Types.ObjectId | null;
  actorUserId?: string | Types.ObjectId | null;
  actorType: "user" | "client" | "system" | "admin";
  eventType: string;
  entityType: string;
  entityId?: string | Types.ObjectId | null;
  summary: string;
  previousValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  correlationId?: string | null;
  ipHash?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  await connectDb();
  return AuditEvent.create({
    workspaceId: input.workspaceId ?? null,
    actorUserId: input.actorUserId ?? null,
    actorType: input.actorType,
    eventType: input.eventType,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    summary: input.summary,
    previousValues: input.previousValues ?? null,
    newValues: input.newValues ?? null,
    correlationId: input.correlationId ?? null,
    ipHash: input.ipHash ?? null,
    metadata: input.metadata ?? null,
    immutable: true,
  });
}
