import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { INVOICE_STATUSES } from "./enums";

const InvoiceSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    proposalId: {
      type: Schema.Types.ObjectId,
      ref: "ChangeProposal",
      default: null,
    },
    invoiceNumber: { type: String, required: true },
    status: { type: String, enum: INVOICE_STATUSES, default: "draft", index: true },
    issueDate: { type: Date, default: null },
    dueDate: { type: Date, default: null },
    currency: { type: String, required: true, uppercase: true },
    subtotalMinor: { type: Number, default: 0 },
    taxMinor: { type: Number, default: 0 },
    totalMinor: { type: Number, required: true },
    amountPaidMinor: { type: Number, default: 0 },
    outstandingMinor: { type: Number, required: true },
    notes: { type: String, default: "" },
    createdById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    voidedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

InvoiceSchema.index({ workspaceId: 1, invoiceNumber: 1 }, { unique: true });
InvoiceSchema.index({ workspaceId: 1, status: 1, dueDate: 1 });

export type InvoiceDocument = InferSchemaType<typeof InvoiceSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Invoice: Model<InvoiceDocument> =
  mongoose.models.Invoice ?? mongoose.model<InvoiceDocument>("Invoice", InvoiceSchema);
