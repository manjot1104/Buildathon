import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { REQUEST_PRIORITIES, REQUEST_SOURCES, REQUEST_STATUSES } from "./enums";

const StatusHistorySchema = new Schema(
  {
    from: { type: String, default: null },
    to: { type: String, required: true },
    at: { type: Date, default: Date.now },
    byUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    note: { type: String, default: "" },
  },
  { _id: false }
);

const ClientRequestSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    title: { type: String, required: true, trim: true },
    originalMessage: { type: String, default: "" },
    description: { type: String, default: "" },
    sourceChannel: { type: String, enum: REQUEST_SOURCES, default: "other" },
    receivedAt: { type: Date, default: Date.now },
    priority: { type: String, enum: REQUEST_PRIORITIES, default: "medium" },
    status: { type: String, enum: REQUEST_STATUSES, default: "new", index: true },
    statusHistory: { type: [StatusHistorySchema], default: [] },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    internalNotes: { type: String, default: "" },
    attachmentIds: [{ type: Schema.Types.ObjectId, ref: "Attachment" }],
    currentAnalysisId: {
      type: Schema.Types.ObjectId,
      ref: "ScopeAnalysis",
      default: null,
    },
    currentProposalId: {
      type: Schema.Types.ObjectId,
      ref: "ChangeProposal",
      default: null,
    },
    createdById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ClientRequestSchema.index({ workspaceId: 1, status: 1, updatedAt: -1 });
ClientRequestSchema.index({ workspaceId: 1, projectId: 1, createdAt: -1 });
ClientRequestSchema.index({ workspaceId: 1, title: "text", description: "text" });

export type ClientRequestDocument = InferSchemaType<typeof ClientRequestSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ClientRequest: Model<ClientRequestDocument> =
  mongoose.models.ClientRequest ??
  mongoose.model<ClientRequestDocument>("ClientRequest", ClientRequestSchema);
