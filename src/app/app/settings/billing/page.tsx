"use client";

import { useEffect, useState } from "react";
import { CreditCard, Wallet } from "lucide-react";

import { SettingsShell } from "@/components/app/settings-shell";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageAtmosphere } from "@/components/motion/page-atmosphere";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { appGet } from "@/lib/api/app-fetch";

type MeData = {
  workspace: { planId: string; subscriptionStatus: string } | null;
};

type HealthData = {
  integrations: { billing: string };
};

export default function BillingSettingsPage() {
  const [me, setMe] = useState<MeData | null>(null);
  const [billingConfigured, setBillingConfigured] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const [meRes, healthRes] = await Promise.all([
        appGet<MeData>("/api/v1/auth/me"),
        appGet<HealthData>("/api/v1/health"),
      ]);
      if (!meRes.ok) setError(meRes.message);
      else setMe(meRes.data);
      if (healthRes.ok) {
        setBillingConfigured(healthRes.data.integrations.billing === "configured");
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <LoadingState label="Loading billing…" />;
  if (error) return <ErrorState message={error} />;

  const unconfigured =
    billingConfigured === false ||
    me?.workspace?.subscriptionStatus === "unconfigured";

  return (
    <PageAtmosphere kind="money" showLabel>
      <SettingsShell title="Billing" description="Plan and payment provider status.">
        {unconfigured ? (
          <Alert className="mb-4 border-pending/40 bg-pending/10">
            <AlertTitle className="flex items-center gap-2 font-display">
              <Wallet className="size-4 text-pending" />
              Billing setup required
            </AlertTitle>
            <AlertDescription>
              Connect a billing provider in your environment to charge clients and manage
              subscriptions.
            </AlertDescription>
          </Alert>
        ) : null}

        <Card className="overflow-hidden border-money/25 bg-gradient-to-br from-money/8 via-card to-card">
          <div className="flex items-center gap-3 border-b border-money/15 bg-money/5 px-6 py-4">
            <span className="rounded-xl bg-money/15 p-2 text-money">
              <CreditCard className="size-5" />
            </span>
            <div>
              <p className="font-display font-bold">Subscription</p>
              <p className="text-xs text-muted-foreground">Workspace plan & provider</p>
            </div>
          </div>
          <CardContent className="space-y-4 pt-6 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Plan</span>
              <StatusBadge status={me?.workspace?.planId ?? "free"} />
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Subscription status</span>
              <StatusBadge status={me?.workspace?.subscriptionStatus ?? "unconfigured"} />
            </div>
            <div className="flex justify-between gap-4 border-t pt-4">
              <span className="text-muted-foreground">Payment provider</span>
              <span
                className={
                  billingConfigured
                    ? "font-semibold text-money"
                    : "font-medium text-pending"
                }
              >
                {billingConfigured ? "Configured" : "Not connected"}
              </span>
            </div>
          </CardContent>
        </Card>
      </SettingsShell>
    </PageAtmosphere>
  );
}
