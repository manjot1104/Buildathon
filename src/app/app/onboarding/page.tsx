"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { appPatch, appPost } from "@/lib/api/app-fetch";

const STEPS = ["Workspace", "Region", "Pricing", "First project"] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [workspaceName, setWorkspaceName] = useState("");
  const [type, setType] = useState<"freelancer" | "agency">("freelancer");
  const [currency, setCurrency] = useState("INR");
  const [timezone, setTimezone] = useState(
    typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "Asia/Kolkata"
  );
  const [pricingModel, setPricingModel] = useState<"fixed" | "hourly" | "milestone">("fixed");
  const [defaultHourlyRate, setDefaultHourlyRate] = useState("");

  async function finishOnboarding() {
    setSubmitting(true);
    setError(null);

    const workspaceRes = await appPost<{ workspaceId: string }>("/api/v1/onboarding/workspace", {
      workspaceName,
      type,
      currency,
      timezone,
      defaultPricingModel: pricingModel,
      ...(defaultHourlyRate !== "" ? { defaultHourlyRate: Number(defaultHourlyRate) } : {}),
    });

    if (!workspaceRes.ok) {
      setError(workspaceRes.message);
      setSubmitting(false);
      return;
    }

    const completeRes = await appPatch<{ onboardingCompletedAt: string | null }>(
      "/api/v1/onboarding/workspace",
      { completed: true, step: 8 }
    );

    if (!completeRes.ok) {
      setError(completeRes.message);
      setSubmitting(false);
      return;
    }

    router.push("/app");
    router.refresh();
  }

  function nextStep() {
    if (step === 0 && !workspaceName.trim()) {
      setError("Workspace name is required.");
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Welcome to ScopePilot"
        description="Set up your workspace in a few steps. You can change these later in settings."
      />

      <div className="mb-6 flex gap-2">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={`h-1 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`}
            aria-hidden
          />
        ))}
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          {step === 0 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="workspaceName">Workspace name</Label>
                <Input
                  id="workspaceName"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="Acme Studio"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onChange={(e) => setType(e.target.value as typeof type)}>
                  <option value="freelancer">Freelancer</option>
                  <option value="agency">Agency</option>
                </Select>
              </div>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value.toUpperCase().slice(0, 3))}
                  maxLength={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input id="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} />
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <div className="space-y-2">
                <Label>Default pricing model</Label>
                <Select
                  value={pricingModel}
                  onChange={(e) => setPricingModel(e.target.value as typeof pricingModel)}
                >
                  <option value="fixed">Fixed price</option>
                  <option value="hourly">Hourly</option>
                  <option value="milestone">Milestone</option>
                </Select>
              </div>
              {pricingModel === "hourly" ? (
                <div className="space-y-2">
                  <Label htmlFor="rate">Default hourly rate (major units)</Label>
                  <Input
                    id="rate"
                    type="number"
                    min={0}
                    value={defaultHourlyRate}
                    onChange={(e) => setDefaultHourlyRate(e.target.value)}
                  />
                </div>
              ) : null}
            </>
          ) : null}

          {step === 3 ? (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Optional: create your first project now, or finish setup and add one later.</p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={submitting}
                onClick={async () => {
                  await finishOnboarding();
                  router.push("/app/projects/new");
                }}
              >
                Create first project
              </Button>
            </div>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex flex-wrap gap-2 pt-2">
            {step > 0 ? (
              <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
                Back
              </Button>
            ) : null}
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={nextStep}>
                Continue
              </Button>
            ) : (
              <>
                <Button type="button" variant="secondary" disabled={submitting} onClick={() => void finishOnboarding()}>
                  Skip project & finish
                </Button>
                <Button type="button" disabled={submitting} onClick={() => void finishOnboarding()}>
                  Finish setup
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
