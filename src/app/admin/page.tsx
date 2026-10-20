import { connectDb } from "@/lib/db/connection";
import { User, Workspace, AuditEvent } from "@/models";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminHomePage() {
  await connectDb();
  const [users, workspaces, recentAudits] = await Promise.all([
    User.countDocuments(),
    Workspace.countDocuments(),
    AuditEvent.find({ actorType: "admin" }).sort({ createdAt: -1 }).limit(10).lean(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Platform overview</h1>
      <p className="text-sm text-slate-600">
        Restricted administration. Customer project contents are not exposed here by default.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Users</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{users}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workspaces</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{workspaces}</CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent admin audit events</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          {recentAudits.length === 0 && <p>No admin actions recorded yet.</p>}
          {recentAudits.map((a) => (
            <div key={String(a._id)} className="flex justify-between border-b border-slate-100 py-2">
              <span>{a.summary}</span>
              <span className="text-xs">{new Date(a.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
