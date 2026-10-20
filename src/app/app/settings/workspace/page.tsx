"use client";

import { useEffect, useState } from "react";

import { SettingsShell } from "@/components/app/settings-shell";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { appGet } from "@/lib/api/app-fetch";

type MeData = {
  workspace: {
    id: string;
    name: string;
    slug: string;
    currency: string;
    type: string;
    planId: string;
    subscriptionStatus: string;
  } | null;
};

export default function WorkspaceSettingsPage() {
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

  if (loading) return <LoadingState label="Loading workspace…" />;
  if (error) return <ErrorState message={error} />;
  if (!data?.workspace) return <ErrorState message="No workspace configured." />;

  const ws = data.workspace;

  return (
    <SettingsShell title="Workspace" description="Active workspace settings.">
      <Card>
        <CardContent className="space-y-3 pt-6 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{ws.name}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Slug</span>
            <span>{ws.slug}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Type</span>
            <span className="capitalize">{ws.type}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Currency</span>
            <span>{ws.currency}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Plan</span>
            <StatusBadge status={ws.planId} />
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Subscription</span>
            <StatusBadge status={ws.subscriptionStatus} />
          </div>
        </CardContent>
      </Card>
    </SettingsShell>
  );
}
