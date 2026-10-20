import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { USER_ROLES } from "./enums";

const NotificationPrefsSchema = new Schema(
  {
    email: { type: Boolean, default: true },
    inApp: { type: Boolean, default: true },
    proposalApproved: { type: Boolean, default: true },
    proposalRejected: { type: Boolean, default: true },
    proposalViewed: { type: Boolean, default: true },
    clarificationRequested: { type: Boolean, default: true },
    deadlineApproaching: { type: Boolean, default: true },
    paymentRecorded: { type: Boolean, default: true },
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: USER_ROLES, default: "user" },
    emailVerifiedAt: { type: Date, default: null },
    emailVerificationTokenHash: { type: String, default: null, select: false },
    emailVerificationExpiresAt: { type: Date, default: null },
    passwordResetTokenHash: { type: String, default: null, select: false },
    passwordResetExpiresAt: { type: Date, default: null },
    timezone: { type: String, default: "Asia/Kolkata" },
    preferredTone: {
      type: String,
      enum: ["friendly", "neutral", "firm", "concise", "clarification_first"],
      default: "neutral",
    },
    notificationPrefs: { type: NotificationPrefsSchema, default: () => ({}) },
    onboardingStep: { type: Number, default: 0 },
    onboardingCompletedAt: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

UserSchema.index({ role: 1 });

export type UserDocument = InferSchemaType<typeof UserSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const User: Model<UserDocument> =
  mongoose.models.User ?? mongoose.model<UserDocument>("User", UserSchema);
