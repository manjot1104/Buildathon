import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { ANALYSIS_CLASSIFICATIONS } from "./enums";

const ScopeAnalysisSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    requestId: {
      type: Schema.Types.ObjectId,
      ref: "ClientRequest",
      required: true,
      index: true,
    },
    scopeVersionId: {
      type: Schema.Types.ObjectId,
      ref: "ScopeVersion",
      required: true,
    },
    mode: { type: String, enum: ["ai", "manual"], required: true },
    classification: {
      type: String,
      enum: ANALYSIS_CLASSIFICATIONS,
      required: true,
    },
    explanation: { type: String, required: true },
    relevantScopeItems: [{ type: String }],
    evidenceExcerpts: [{ type: String }],
    followUpQuestions: [{ type: String }],
    effortLowHours: { type: Number, default: null },
    effortHighHours: { type: Number, default: null },
    deadlineImpactDays: { type: Number, default: null },
    suggestedClientResponse: { type: String, default: "" },
    confidence: { type: Number, min: 0, max: 1, default: null },
    limitations: { type: String, default: "" },
    insufficientEvidence: { type: Boolean, default: false },
    provider: { type: String, default: null },
    modelName: { type: String, default: null },
    createdById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    confirmedById: { type: Schema.Types.ObjectId, ref: "User", default: null },
    confirmedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ScopeAnalysisSchema.index({ workspaceId: 1, requestId: 1, createdAt: -1 });

export type ScopeAnalysisDocument = InferSchemaType<typeof ScopeAnalysisSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ScopeAnalysis: Model<ScopeAnalysisDocument> =
  mongoose.models.ScopeAnalysis ??
  mongoose.model<ScopeAnalysisDocument>("ScopeAnalysis", ScopeAnalysisSchema);
