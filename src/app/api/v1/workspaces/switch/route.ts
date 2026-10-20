import { z } from "zod";
import { jsonOk, jsonError } from "@/lib/api/response";
import { requireSession } from "@/lib/auth/session";
import { requireWorkspaceMember } from "@/lib/auth/authorization";
import { setWorkspaceCookieValue } from "@/lib/api/workspace";

export const dynamic = "force-dynamic";

const schema = z.object({ workspaceId: z.string().min(1) });

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = schema.parse(await req.json());
    await requireWorkspaceMember(session, body.workspaceId);
    setWorkspaceCookieValue(body.workspaceId);
    return jsonOk({ workspaceId: body.workspaceId });
  } catch (err) {
    return jsonError(err);
  }
}
