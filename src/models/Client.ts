import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const ClientSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, default: null, lowercase: true, trim: true },
    company: { type: String, default: null, trim: true },
    phone: { type: String, default: null },
    notes: { type: String, default: null },
    preferredChannel: {
      type: String,
      enum: ["whatsapp", "email", "meeting", "phone", "other"],
      default: "email",
    },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ClientSchema.index({ workspaceId: 1, name: 1 });
ClientSchema.index({ workspaceId: 1, email: 1 });

export type ClientDocument = InferSchemaType<typeof ClientSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Client: Model<ClientDocument> =
  mongoose.models.Client ?? mongoose.model<ClientDocument>("Client", ClientSchema);
