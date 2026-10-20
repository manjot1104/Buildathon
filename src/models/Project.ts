import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { PRICING_MODELS, PROJECT_STATUSES } from "./enums";

const ProjectSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    status: { type: String, enum: PROJECT_STATUSES, default: "draft", index: true },
    startDate: { type: Date, default: null },
    deadline: { type: Date, default: null },
    currency: { type: String, required: true, uppercase: true },
    originalPriceMinor: { type: Number, default: 0 },
    pricingModel: { type: String, enum: PRICING_MODELS, default: "fixed" },
    defaultHourlyRateMinor: { type: Number, default: 0 },
    estimatedOriginalHours: { type: Number, default: null },
    includedRevisions: { type: Number, default: 0 },
    revisionPolicy: { type: String, default: "" },
    communicationMethod: { type: String, default: "" },
    exclusionsSummary: { type: String, default: "" },
    internalNotes: { type: String, default: "" },
    currentScopeVersionId: {
      type: Schema.Types.ObjectId,
      ref: "ScopeVersion",
      default: null,
    },
    collaboratorIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    createdById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ProjectSchema.index({ workspaceId: 1, status: 1, updatedAt: -1 });
ProjectSchema.index({ workspaceId: 1, clientId: 1 });
ProjectSchema.index({ workspaceId: 1, name: "text", description: "text" });

export type ProjectDocument = InferSchemaType<typeof ProjectSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Project: Model<ProjectDocument> =
  mongoose.models.Project ?? mongoose.model<ProjectDocument>("Project", ProjectSchema);
