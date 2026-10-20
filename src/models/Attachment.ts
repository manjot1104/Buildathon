import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const AttachmentSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", default: null },
    uploadedById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    storageKey: { type: String, required: true },
    storageProvider: { type: String, enum: ["local", "s3"], default: "local" },
    entityType: {
      type: String,
      enum: ["project", "scope", "request", "proposal", "invoice", "other"],
      default: "other",
    },
    entityId: { type: Schema.Types.ObjectId, default: null },
    checksumSha256: { type: String, default: null },
  },
  { timestamps: true }
);

AttachmentSchema.index({ workspaceId: 1, entityType: 1, entityId: 1 });

export type AttachmentDocument = InferSchemaType<typeof AttachmentSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Attachment: Model<AttachmentDocument> =
  mongoose.models.Attachment ??
  mongoose.model<AttachmentDocument>("Attachment", AttachmentSchema);
