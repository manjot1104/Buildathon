import { connectDb } from "@/lib/db/connection";
import { Workspace } from "@/models";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminWorkspacesPage() {
  await connectDb();
  const workspaces = await Workspace.find()
    .select("name slug planId subscriptionStatus isActive createdAt type")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Workspaces</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tenant workspaces</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-slate-500">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Plan</th>
                  <th className="py-2 pr-4">Subscription</th>
                  <th className="py-2">Active</th>
                </tr>
              </thead>
              <tbody>
                {workspaces.map((w) => (
                  <tr key={String(w._id)} className="border-b border-slate-100">
                    <td className="py-2 pr-4">
                      {w.name}{" "}
                      <span className="text-xs text-slate-400">/{w.slug}</span>
                    </td>
                    <td className="py-2 pr-4">{w.type}</td>
                    <td className="py-2 pr-4">{w.planId}</td>
                    <td className="py-2 pr-4">{w.subscriptionStatus}</td>
                    <td className="py-2">{w.isActive ? "yes" : "no"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
