import { connectDb } from "@/lib/db/connection";
import { Notification, User } from "@/models";
import { enqueueJob } from "@/lib/jobs/queue";
import type { Types } from "mongoose";

export async function createNotification(input: {
  workspaceId: string | Types.ObjectId;
  userId: string | Types.ObjectId;
  type: string;
  title: string;
  body: string;
  href?: string | null;
  entityType?: string | null;
  entityId?: string | Types.ObjectId | null;
  dedupeKey?: string | null;
  sendEmail?: boolean;
}) {
  await connectDb();

  if (input.dedupeKey) {
    const existing = await Notification.findOne({
      workspaceId: input.workspaceId,
      dedupeKey: input.dedupeKey,
    });
    if (existing) return existing;
  }

  const notification = await Notification.create({
    workspaceId: input.workspaceId,
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    href: input.href ?? null,
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
    dedupeKey: input.dedupeKey ?? null,
  });

  if (input.sendEmail !== false) {
    const user = await User.findById(input.userId);
    if (user?.notificationPrefs?.email !== false) {
      await enqueueJob({
        type: "send_email",
        idempotencyKey: `notif-email:${notification._id}`,
        payload: {
          to: user?.email,
          template: "generic",
          data: {
            subject: input.title,
            body: `${input.body}${input.href ? `\n\n${process.env.APP_URL ?? ""}${input.href}` : ""}`,
          },
        },
      });
      notification.emailSentAt = new Date();
      await notification.save();
    }
  }

  return notification;
}
