import { jsonOk, jsonError } from "@/lib/api/response";
import { requireSession } from "@/lib/auth/session";
import { connectDb } from "@/lib/db/connection";
import { Workspace, WorkspaceMembership } from "@/models";
import { getActiveWorkspaceId } from "@/lib/api/workspace";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireSession();
    await connectDb();
    let workspace = null;
    try {
      const workspaceId = await getActiveWorkspaceId(session);
      const [ws, memberships] = await Promise.all([
        Workspace.findById(workspaceId).lean(),
        WorkspaceMembership.find({ userId: session.user.id, status: "active" })
          .populate("workspaceId", "name slug planId")
          .lean(),
      ]);
      workspace = ws
        ? {
            id: String(ws._id),
            name: ws.name,
            slug: ws.slug,
            planId: ws.planId,
            currency: ws.currency,
            type: ws.type,
            subscriptionStatus: ws.subscriptionStatus,
          }
        : null;
      return jsonOk({
        user: session.user,
        workspace,
        workspaces: memberships.map((m) => {
          const w = m.workspaceId as unknown as {
            _id: { toString(): string };
            name: string;
            slug: string;
            planId: string;
          } | null;
          return {
            id: w ? String(w._id) : String(m.workspaceId),
            name: w?.name ?? "",
            slug: w?.slug ?? "",
            planId: w?.planId ?? "free",
            role: m.role,
          };
        }),
      });
    } catch {
      return jsonOk({ user: session.user, workspace: null, workspaces: [] });
    }
  } catch (err) {
    return jsonError(err);
  }
}
