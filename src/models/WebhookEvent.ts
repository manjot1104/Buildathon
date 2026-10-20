import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const WebhookEventSchema = new Schema(
  {
    provider: { type: String, required: true },
    eventId: { type: String, required: true },
    eventType: { type: String, required: true },
    payloadHash: { type: String, required: true },
    processedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ["processed", "ignored", "failed"], default: "processed" },
    error: { type: String, default: null },
  },
  { timestamps: true }
);

WebhookEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });

export type WebhookEventDocument = InferSchemaType<typeof WebhookEventSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const WebhookEvent: Model<WebhookEventDocument> =
  mongoose.models.WebhookEvent ??
  mongoose.model<WebhookEventDocument>("WebhookEvent", WebhookEventSchema);
