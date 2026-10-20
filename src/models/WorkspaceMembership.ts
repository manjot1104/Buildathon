import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { MEMBERSHIP_ROLES, MEMBERSHIP_STATUS } from "./enums";

const PermissionsSchema = new Schema(
  {
    canPrepareProposals: { type: Boolean, default: true },
    canSendProposals: { type: Boolean, default: false },
    canManageBilling: { type: Boolean, default: false },
    canManageTeam: { type: Boolean, default: false },
    canManageIntegrations: { type: Boolean, default: false },
  },
  { _id: false }
);

const WorkspaceMembershipSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: { type: String, enum: MEMBERSHIP_ROLES, required: true },
    status: { type: String, enum: MEMBERSHIP_STATUS, default: "active" },
    permissions: { type: PermissionsSchema, default: () => ({}) },
    invitedEmail: { type: String, default: null },
    inviteTokenHash: { type: String, default: null, select: false },
    inviteExpiresAt: { type: Date, default: null },
    joinedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

WorkspaceMembershipSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });
WorkspaceMembershipSchema.index({ workspaceId: 1, status: 1 });

export type WorkspaceMembershipDocument = InferSchemaType<
  typeof WorkspaceMembershipSchema
> & { _id: mongoose.Types.ObjectId };

export const WorkspaceMembership: Model<WorkspaceMembershipDocument> =
  mongoose.models.WorkspaceMembership ??
  mongoose.model<WorkspaceMembershipDocument>(
    "WorkspaceMembership",
    WorkspaceMembershipSchema
  );
