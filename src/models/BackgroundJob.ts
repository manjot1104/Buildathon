import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { JOB_STATUSES } from "./enums";

const BackgroundJobSchema = new Schema(
  {
    type: { type: String, required: true, index: true },
    status: { type: String, enum: JOB_STATUSES, default: "pending", index: true },
    payload: { type: Schema.Types.Mixed, required: true },
    idempotencyKey: { type: String, default: null },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    availableAt: { type: Date, default: Date.now },
    lockedAt: { type: Date, default: null },
    lockedBy: { type: String, default: null },
    lastError: { type: String, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

BackgroundJobSchema.index({ status: 1, availableAt: 1 });
BackgroundJobSchema.index({ type: 1, idempotencyKey: 1 }, { unique: true, sparse: true });

export type BackgroundJobDocument = InferSchemaType<typeof BackgroundJobSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const BackgroundJob: Model<BackgroundJobDocument> =
  mongoose.models.BackgroundJob ??
  mongoose.model<BackgroundJobDocument>("BackgroundJob", BackgroundJobSchema);
