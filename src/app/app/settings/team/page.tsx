"use client";

import { useEffect, useState } from "react";

import { SettingsShell } from "@/components/app/settings-shell";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { appGet } from "@/lib/api/app-fetch";

type MeData = {
  workspaces: Array<{ id: string; name: string; slug: string; planId: string; role: string }>;
};

export default function TeamSettingsPage() {
  const [data, setData] = useState<MeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const res = await appGet<MeData>("/api/v1/auth/me");
      if (!res.ok) setError(res.message);
      else setData(res.data);
      setLoading(false);
    })();
  }, []);

  if (loading) return <LoadingState label="Loading team…" />;
  if (error) return <ErrorState message={error} />;

  return (
    <SettingsShell title="Team" description="Workspace membership and roles.">
      {!data?.workspaces.length ? (
        <p className="text-sm text-muted-foreground">No workspace memberships found.</p>
      ) : (
        <ul className="space-y-2">
          {data.workspaces.map((w) => (
            <Card key={w.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-2 pt-6 text-sm">
                <div>
                  <p className="font-medium">{w.name}</p>
                  <p className="text-muted-foreground">{w.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={w.role} />
                  <StatusBadge status={w.planId} />
                </div>
              </CardContent>
            </Card>
          ))}
        </ul>
      )}
      <p className="mt-4 text-xs text-muted-foreground">
        Inviting teammates is managed by workspace owners in a future release.
      </p>
    </SettingsShell>
  );
}
