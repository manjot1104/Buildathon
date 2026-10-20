import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const PaymentRecordSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice", required: true, index: true },
    amountMinor: { type: Number, required: true },
    currency: { type: String, required: true, uppercase: true },
    paidAt: { type: Date, required: true },
    reference: { type: String, default: "" },
    method: { type: String, default: "manual" },
    notes: { type: String, default: "" },
    recordedById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    providerEventId: { type: String, default: null },
  },
  { timestamps: true }
);

PaymentRecordSchema.index(
  { workspaceId: 1, providerEventId: 1 },
  { unique: true, sparse: true }
);

export type PaymentRecordDocument = InferSchemaType<typeof PaymentRecordSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const PaymentRecord: Model<PaymentRecordDocument> =
  mongoose.models.PaymentRecord ??
  mongoose.model<PaymentRecordDocument>("PaymentRecord", PaymentRecordSchema);
