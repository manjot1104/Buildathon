import { z } from "zod";
import { jsonCreated, jsonOk, jsonError } from "@/lib/api/response";
import { requireAuthWorkspace } from "@/lib/api/workspace";
import { createClient } from "@/lib/services/project-service";
import { connectDb } from "@/lib/db/connection";
import { Client } from "@/models";

export async function GET(req: Request) {
  try {
    const { workspace } = await requireAuthWorkspace();
    await connectDb();
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim();
    const filter: Record<string, unknown> = {
      workspaceId: workspace.workspaceId,
      archivedAt: null,
    };
    if (q) {
      filter.$or = [
        { name: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
        { email: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
        { company: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
      ];
    }
    const items = await Client.find(filter).sort({ name: 1 }).limit(100).lean();
    return jsonOk({
      items: items.map((c) => ({
        id: String(c._id),
        name: c.name,
        email: c.email,
        company: c.company,
        phone: c.phone,
        preferredChannel: c.preferredChannel,
      })),
    });
  } catch (err) {
    return jsonError(err);
  }
}

const schema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().optional().nullable(),
  company: z.string().max(200).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  preferredChannel: z.enum(["whatsapp", "email", "meeting", "phone", "other"]).optional(),
});

export async function POST(req: Request) {
  try {
    const { workspace } = await requireAuthWorkspace();
    const body = schema.parse(await req.json());
    const client = await createClient({
      workspaceId: workspace.workspaceId,
      ...body,
    });
    return jsonCreated({
      id: String(client._id),
      name: client.name,
      email: client.email,
      company: client.company,
    });
  } catch (err) {
    return jsonError(err);
  }
}
