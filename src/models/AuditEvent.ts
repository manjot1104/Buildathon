import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const AuditEventSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      default: null,
      index: true,
    },
    actorUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    actorType: {
      type: String,
      enum: ["user", "client", "system", "admin"],
      required: true,
    },
    eventType: { type: String, required: true, index: true },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, default: null },
    summary: { type: String, required: true },
    previousValues: { type: Schema.Types.Mixed, default: null },
    newValues: { type: Schema.Types.Mixed, default: null },
    correlationId: { type: String, default: null },
    ipHash: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: null },
    immutable: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditEventSchema.index({ workspaceId: 1, createdAt: -1 });
AuditEventSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

export type AuditEventDocument = InferSchemaType<typeof AuditEventSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AuditEvent: Model<AuditEventDocument> =
  mongoose.models.AuditEvent ??
  mongoose.model<AuditEventDocument>("AuditEvent", AuditEventSchema);
