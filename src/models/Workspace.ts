import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { PLAN_IDS, SUBSCRIPTION_STATUSES, WORKSPACE_TYPES } from "./enums";

const EntitlementUsageSchema = new Schema(
  {
    activeProjects: { type: Number, default: 0 },
    proposalsThisMonth: { type: Number, default: 0 },
    usageMonthKey: { type: String, default: "" },
  },
  { _id: false }
);

const WorkspaceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    type: { type: String, enum: WORKSPACE_TYPES, required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    currency: { type: String, required: true, default: "INR", uppercase: true },
    timezone: { type: String, default: "Asia/Kolkata" },
    defaultPricingModel: {
      type: String,
      enum: ["fixed", "hourly", "milestone"],
      default: "hourly",
    },
    defaultHourlyRateMinor: { type: Number, default: 0 },
    taxRateBps: { type: Number, default: 0 },
    logoUrl: { type: String, default: null },
    billingEmail: { type: String, default: null },
    planId: { type: String, enum: PLAN_IDS, default: "free" },
    subscriptionStatus: {
      type: String,
      enum: SUBSCRIPTION_STATUSES,
      default: "unconfigured",
    },
    stripeCustomerId: { type: String, default: null, select: false },
    stripeSubscriptionId: { type: String, default: null, select: false },
    trialEndsAt: { type: Date, default: null },
    usage: { type: EntitlementUsageSchema, default: () => ({}) },
    isActive: { type: Boolean, default: true },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

WorkspaceSchema.index({ planId: 1, isActive: 1 });

export type WorkspaceDocument = InferSchemaType<typeof WorkspaceSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Workspace: Model<WorkspaceDocument> =
  mongoose.models.Workspace ??
  mongoose.model<WorkspaceDocument>("Workspace", WorkspaceSchema);
