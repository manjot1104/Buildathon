import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const SessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    userAgent: { type: String, default: null },
    ipHash: { type: String, default: null },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
SessionSchema.index({ userId: 1, revokedAt: 1 });

export type SessionDocument = InferSchemaType<typeof SessionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Session: Model<SessionDocument> =
  mongoose.models.Session ?? mongoose.model<SessionDocument>("Session", SessionSchema);
