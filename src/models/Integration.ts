import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const IntegrationSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ["email", "whatsapp", "openai", "stripe", "storage"],
      required: true,
    },
    status: {
      type: String,
      enum: ["not_connected", "connected", "error", "disabled"],
      default: "not_connected",
    },
    config: { type: Schema.Types.Mixed, default: {} },
    /** Encrypted/secret fields — never returned to clients */
    secrets: { type: Schema.Types.Mixed, default: {}, select: false },
    lastError: { type: String, default: null },
    connectedAt: { type: Date, default: null },
    connectedById: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

IntegrationSchema.index({ workspaceId: 1, provider: 1 }, { unique: true });

export type IntegrationDocument = InferSchemaType<typeof IntegrationSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Integration: Model<IntegrationDocument> =
  mongoose.models.Integration ??
  mongoose.model<IntegrationDocument>("Integration", IntegrationSchema);
