import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { DECISION_TYPES } from "./enums";

const ProposalDecisionSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    proposalId: {
      type: Schema.Types.ObjectId,
      ref: "ChangeProposal",
      required: true,
      index: true,
    },
    proposalRevision: { type: Number, required: true },
    decision: { type: String, enum: DECISION_TYPES, required: true },
    comment: { type: String, default: "" },
    clientNameEntered: { type: String, default: "" },
    confirmationAccepted: { type: Boolean, default: false },
    ipHash: { type: String, default: null },
    userAgent: { type: String, default: null },
    idempotencyKey: { type: String, default: null },
  },
  { timestamps: true }
);

ProposalDecisionSchema.index({ proposalId: 1, decision: 1 });
ProposalDecisionSchema.index(
  { proposalId: 1, idempotencyKey: 1 },
  { unique: true, sparse: true }
);

export type ProposalDecisionDocument = InferSchemaType<typeof ProposalDecisionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ProposalDecision: Model<ProposalDecisionDocument> =
  mongoose.models.ProposalDecision ??
  mongoose.model<ProposalDecisionDocument>("ProposalDecision", ProposalDecisionSchema);
