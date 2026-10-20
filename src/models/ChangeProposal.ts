import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { PROPOSAL_STATUSES } from "./enums";

const LineItemSchema = new Schema(
  {
    description: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    rateMinor: { type: Number, required: true },
    amountMinor: { type: Number, required: true },
  },
  { _id: false }
);

const SnapshotSchema = new Schema(
  {
    projectName: String,
    workspaceName: String,
    clientName: String,
    requestSummary: String,
    additionalWorkDescription: String,
    whySeparate: String,
    deliverables: [String],
    exclusions: [String],
    assumptions: [String],
    lineItems: [LineItemSchema],
    subtotalMinor: Number,
    discountMinor: Number,
    feesMinor: Number,
    taxMinor: Number,
    totalMinor: Number,
    currency: String,
    additionalWorkingDays: Number,
    originalDeadline: Date,
    proposedDeadline: Date,
    deadlineExplanation: String,
    paymentTerms: String,
    milestoneImpact: String,
    scopeVersionId: Schema.Types.ObjectId,
    scopeExcerpt: String,
  },
  { _id: false }
);

const ChangeProposalSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    requestId: {
      type: Schema.Types.ObjectId,
      ref: "ClientRequest",
      required: true,
      index: true,
    },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    proposalNumber: { type: String, required: true },
    revision: { type: Number, default: 1 },
    status: { type: String, enum: PROPOSAL_STATUSES, default: "draft", index: true },
    title: { type: String, required: true },
    lineItems: { type: [LineItemSchema], default: [] },
    subtotalMinor: { type: Number, default: 0 },
    discountMinor: { type: Number, default: 0 },
    feesMinor: { type: Number, default: 0 },
    taxMinor: { type: Number, default: 0 },
    totalMinor: { type: Number, default: 0 },
    currency: { type: String, required: true, uppercase: true },
    additionalWorkingDays: { type: Number, default: 0 },
    originalDeadline: { type: Date, default: null },
    proposedDeadline: { type: Date, default: null },
    deadlineExplanation: { type: String, default: "" },
    paymentTerms: { type: String, default: "" },
    whySeparate: { type: String, default: "" },
    deliverables: [{ type: String }],
    exclusions: [{ type: String }],
    assumptions: [{ type: String }],
    additionalWorkDescription: { type: String, default: "" },
    milestoneImpact: { type: String, default: "" },
    expiresAt: { type: Date, default: null },
    sentAt: { type: Date, default: null },
    viewedAt: { type: Date, default: null },
    decidedAt: { type: Date, default: null },
    workCompletedAt: { type: Date, default: null },
    scopeVersionId: {
      type: Schema.Types.ObjectId,
      ref: "ScopeVersion",
      required: true,
    },
    /** Frozen commercial terms after send — immutable for client decisions */
    sentSnapshot: { type: SnapshotSchema, default: null },
    accessTokenHash: { type: String, default: null, index: true, select: false },
    accessTokenExpiresAt: { type: Date, default: null },
    accessTokenRevokedAt: { type: Date, default: null },
    createdById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    supersededById: {
      type: Schema.Types.ObjectId,
      ref: "ChangeProposal",
      default: null,
    },
  },
  { timestamps: true }
);

ChangeProposalSchema.index({ workspaceId: 1, proposalNumber: 1 }, { unique: true });
ChangeProposalSchema.index({ workspaceId: 1, status: 1, updatedAt: -1 });

export type ChangeProposalDocument = InferSchemaType<typeof ChangeProposalSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ChangeProposal: Model<ChangeProposalDocument> =
  mongoose.models.ChangeProposal ??
  mongoose.model<ChangeProposalDocument>("ChangeProposal", ChangeProposalSchema);
