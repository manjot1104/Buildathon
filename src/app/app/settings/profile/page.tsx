"use client";

import { useEffect, useState } from "react";

import { SettingsShell } from "@/components/app/settings-shell";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { appGet } from "@/lib/api/app-fetch";

type MeData = {
  user: {
    name: string;
    email: string;
    timezone: string;
    preferredTone: string;
    emailVerifiedAt: string | null;
  };
};

export default function ProfileSettingsPage() {
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

  if (loading) return <LoadingState label="Loading profile…" />;
  if (error) return <ErrorState message={error} />;
  if (!data) return <ErrorState message="Profile unavailable." />;

  return (
    <SettingsShell title="Profile" description="Your personal account details.">
      <Card>
        <CardContent className="space-y-3 pt-6 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{data.user.name}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Email</span>
            <span>{data.user.email}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Timezone</span>
            <span>{data.user.timezone}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Preferred tone</span>
            <span className="capitalize">{data.user.preferredTone}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Email verified</span>
            <span>{data.user.emailVerifiedAt ? "Yes" : "Pending"}</span>
          </div>
        </CardContent>
      </Card>
    </SettingsShell>
  );
}
