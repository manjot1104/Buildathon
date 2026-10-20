import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * Generic client-facing access links (request status, portal views).
 * Proposal access tokens are also stored on ChangeProposal for locality.
 */
const ClientAccessLinkSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    purpose: {
      type: String,
      enum: ["proposal", "request_status", "client_portal"],
      required: true,
    },
    tokenHash: { type: String, required: true, unique: true },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    lastAccessedAt: { type: Date, default: null },
    accessCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ClientAccessLinkSchema.index({ expiresAt: 1 });
ClientAccessLinkSchema.index({ entityType: 1, entityId: 1 });

export type ClientAccessLinkDocument = InferSchemaType<typeof ClientAccessLinkSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ClientAccessLink: Model<ClientAccessLinkDocument> =
  mongoose.models.ClientAccessLink ??
  mongoose.model<ClientAccessLinkDocument>("ClientAccessLink", ClientAccessLinkSchema);
