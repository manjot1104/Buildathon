import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const ScopeSectionSchema = new Schema(
  {
    key: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, default: "" },
    items: [{ type: String }],
  },
  { _id: false }
);

const ScopeVersionSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    versionNumber: { type: Number, required: true },
    label: { type: String, default: "" },
    objectives: { type: String, default: "" },
    deliverables: [{ type: String }],
    features: [{ type: String }],
    includedFunctionality: [{ type: String }],
    exclusions: [{ type: String }],
    includedRevisions: { type: Number, default: 0 },
    milestones: [
      {
        name: String,
        dueDate: Date,
        amountMinor: Number,
        description: String,
      },
    ],
    deliveryDates: { type: String, default: "" },
    agreedBudgetMinor: { type: Number, default: 0 },
    paymentTerms: { type: String, default: "" },
    additionalWorkPolicy: { type: String, default: "" },
    sections: [ScopeSectionSchema],
    rawPastedText: { type: String, default: "" },
    sourceAttachmentIds: [{ type: Schema.Types.ObjectId, ref: "Attachment" }],
    extractionNotes: { type: String, default: "" },
    createdById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isCurrent: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ScopeVersionSchema.index({ projectId: 1, versionNumber: 1 }, { unique: true });
ScopeVersionSchema.index({ workspaceId: 1, projectId: 1, isCurrent: 1 });

export type ScopeVersionDocument = InferSchemaType<typeof ScopeVersionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ScopeVersion: Model<ScopeVersionDocument> =
  mongoose.models.ScopeVersion ??
  mongoose.model<ScopeVersionDocument>("ScopeVersion", ScopeVersionSchema);
