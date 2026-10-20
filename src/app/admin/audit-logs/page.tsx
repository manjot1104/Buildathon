import { connectDb } from "@/lib/db/connection";
import { AuditEvent } from "@/models";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminAuditLogsPage() {
  await connectDb();
  const events = await AuditEvent.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .select("eventType summary actorType createdAt workspaceId entityType")
    .lean();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Audit logs</h1>
      <p className="text-sm text-slate-600">
        Summaries only — passwords and secrets are never stored in audit records.
      </p>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent events</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {events.map((e) => (
            <div
              key={String(e._id)}
              className="flex flex-col gap-1 border-b border-slate-100 py-2 sm:flex-row sm:justify-between"
            >
              <div>
                <span className="font-medium text-slate-800">{e.eventType}</span>
                <span className="text-slate-600"> — {e.summary}</span>
              </div>
              <div className="text-xs text-slate-500">
                {e.actorType} · {new Date(e.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
