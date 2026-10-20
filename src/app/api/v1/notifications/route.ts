import { jsonOk, jsonError } from "@/lib/api/response";
import { requireAuthWorkspace } from "@/lib/api/workspace";
import { connectDb } from "@/lib/db/connection";
import { Notification } from "@/models";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { session, workspace } = await requireAuthWorkspace();
    await connectDb();
    const items = await Notification.find({
      workspaceId: workspace.workspaceId,
      userId: session.user.id,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return jsonOk({
      items: items.map((n) => ({
        id: String(n._id),
        type: n.type,
        title: n.title,
        body: n.body,
        href: n.href,
        readAt: n.readAt,
        createdAt: n.createdAt,
      })),
      unreadCount: items.filter((n) => !n.readAt).length,
    });
  } catch (err) {
    return jsonError(err);
  }
}

const markSchema = z.object({
  ids: z.array(z.string()).optional(),
  all: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    const { session, workspace } = await requireAuthWorkspace();
    const body = markSchema.parse(await req.json());
    await connectDb();
    const filter: Record<string, unknown> = {
      workspaceId: workspace.workspaceId,
      userId: session.user.id,
      readAt: null,
    };
    if (!body.all && body.ids?.length) filter._id = { $in: body.ids };
    await Notification.updateMany(filter, { $set: { readAt: new Date() } });
    return jsonOk({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
