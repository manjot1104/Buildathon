"use client";

import { useEffect, useState } from "react";

import { SettingsShell } from "@/components/app/settings-shell";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { appGet } from "@/lib/api/app-fetch";

type HealthData = {
  integrations: {
    email: string;
    whatsapp: string;
    ai: string;
    billing: string;
  };
};

function integrationLabel(status: string) {
  return status === "configured" ? "Connected" : "Not connected";
}

function integrationStatus(status: string) {
  return status === "configured" ? "active" : "draft";
}

export default function IntegrationsSettingsPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const res = await appGet<HealthData>("/api/v1/health");
      if (!res.ok) setError(res.message);
      else setData(res.data);
      setLoading(false);
    })();
  }, []);

  if (loading) return <LoadingState label="Checking integrations…" />;
  if (error) return <ErrorState message={error} />;
  if (!data) return <ErrorState message="Health check unavailable." />;

  const rows = [
    { key: "Email", value: data.integrations.email },
    { key: "WhatsApp", value: data.integrations.whatsapp },
    { key: "AI analysis", value: data.integrations.ai },
    { key: "Billing", value: data.integrations.billing },
  ];

  return (
    <SettingsShell title="Integrations" description="Connected services for this deployment.">
      <Card>
        <CardContent className="divide-y pt-2">
          {rows.map((row) => (
            <div key={row.key} className="flex items-center justify-between py-3 text-sm">
              <span className="font-medium">{row.key}</span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{integrationLabel(row.value)}</span>
                <StatusBadge status={integrationStatus(row.value)} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </SettingsShell>
  );
}
