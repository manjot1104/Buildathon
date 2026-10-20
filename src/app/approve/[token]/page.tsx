"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Stamp } from "lucide-react";

import { BrandMark } from "@/components/brand/logo";
import { AuroraBg } from "@/components/motion/aurora-bg";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StatusBadge } from "@/components/shared/status-badge";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";

interface ProposalView {
  proposalNumber: string;
  revision: number;
  status: string;
  title: string;
  workspaceName: string;
  clientName: string;
  projectName: string;
  requestSummary: string;
  additionalWorkDescription: string;
  whySeparate: string;
  deliverables: string[];
  exclusions: string[];
  lineItems: Array<{
    description: string;
    quantity: number;
    unit: string;
    rateMinor: number;
    amountMinor: number;
  }>;
  subtotal: string;
  tax: string;
  total: string;
  currency: string;
  additionalWorkingDays: number;
  originalDeadline: string | null;
  proposedDeadline: string | null;
  paymentTerms: string;
  scopeExcerpt: string;
  expiresAt: string | null;
  legalNotice: string;
}

export default function ApprovePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [data, setData] = useState<ProposalView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [clientName, setClientName] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/client/proposals/${token}`);
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message ?? "Unable to load proposal");
        setData(null);
      } else {
        setData(json.data);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(decision: "approved" | "rejected" | "clarification_requested") {
    if (decision === "approved" && !confirmed) {
      setError("Please confirm that you accept the terms before approving.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/client/proposals/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": `${decision}-${Date.now()}`,
        },
        body: JSON.stringify({
          decision,
          comment,
          clientNameEntered: clientName,
          confirmationAccepted: decision === "approved" ? confirmed : false,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message ?? "Decision failed");
      } else {
        setResult(json.data.message);
        await load();
      }
    } catch {
      setError("Network error while submitting your decision.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingState label="Loading proposal…" />;
  if (error && !data) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <ErrorState message={error} onRetry={() => void load()} />
      </div>
    );
  }
  if (!data) return null;

  const decided = ["approved", "rejected", "withdrawn", "expired"].includes(data.status);
  const isPending = !decided;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <AuroraBg variant={isPending ? "pending" : "money"} className="opacity-70" />

      <header className="relative z-[1] border-b border-border/60 bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <BrandMark size="sm" />
            <div>
              <p className="font-display text-sm font-bold">
                Scope<span className="text-primary">Pilot</span>
              </p>
              <p className="text-xs text-muted-foreground">Change proposal for review</p>
            </div>
          </div>
          <StatusBadge status={data.status} />
        </div>
      </header>

      <main className="relative z-[1] mx-auto max-w-2xl space-y-4 px-4 py-6 pb-28 animate-fade-in">
        {isPending ? (
          <div className="flex items-center gap-2 rounded-2xl border border-pending/40 bg-pending/10 px-4 py-3 text-sm font-semibold text-amber-950 animate-pending-pulse">
            <Stamp className="size-4" />
            Decision required — review the scope delta and pricing below
          </div>
        ) : null}

        {result && (
          <Alert className="border-money/40 bg-money/10">
            <AlertDescription className="font-medium text-emerald-950">{result}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert className="border-destructive/40 bg-destructive/10">
            <AlertDescription className="text-destructive">{error}</AlertDescription>
          </Alert>
        )}

        <Card className="overflow-hidden shadow-lift">
          <CardHeader className="bg-gradient-to-r from-secondary/80 to-transparent">
            <CardTitle className="font-display text-xl font-bold">{data.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              From <strong className="text-foreground">{data.workspaceName}</strong> · Project{" "}
              <strong className="text-foreground">{data.projectName}</strong>
            </p>
            <p className="text-xs text-muted-foreground">
              {data.proposalNumber} · Revision {data.revision}
              {data.expiresAt
                ? ` · Valid until ${new Date(data.expiresAt).toLocaleDateString()}`
                : ""}
            </p>
          </CardHeader>
          <CardContent className="space-y-5 text-sm">
            <section>
              <h3 className="mb-1 font-display font-semibold">Original request</h3>
              <p className="whitespace-pre-wrap text-muted-foreground">{data.requestSummary}</p>
            </section>
            <section className="rounded-xl border border-pending/25 bg-pending/5 p-4">
              <h3 className="mb-1 font-display font-semibold text-amber-950">
                Additional work proposed
              </h3>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {data.additionalWorkDescription || "See line items below."}
              </p>
              {data.whySeparate && (
                <p className="mt-2 italic text-muted-foreground">{data.whySeparate}</p>
              )}
            </section>
            {data.deliverables?.length > 0 && (
              <section>
                <h3 className="mb-1 font-display font-semibold">Included</h3>
                <ul className="list-disc pl-5 text-muted-foreground">
                  {data.deliverables.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </section>
            )}
            {data.exclusions?.length > 0 && (
              <section>
                <h3 className="mb-1 font-display font-semibold">Not included</h3>
                <ul className="list-disc pl-5 text-muted-foreground">
                  {data.exclusions.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </section>
            )}
            <section>
              <h3 className="mb-2 font-display font-semibold">Price</h3>
              <div className="rounded-xl border border-money/25 bg-gradient-to-br from-money/8 to-transparent p-4">
                {(data.lineItems ?? []).map((item, i) => (
                  <div key={i} className="flex justify-between gap-2 py-1 text-sm text-muted-foreground">
                    <span>
                      {item.description} ({item.quantity} {item.unit})
                    </span>
                  </div>
                ))}
                <div className="mt-2 flex justify-between border-t border-money/20 pt-3 font-display text-lg font-bold text-money">
                  <span>Total</span>
                  <span>{data.total}</span>
                </div>
              </div>
            </section>
            <section className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Original deadline</p>
                <p className="font-medium">
                  {data.originalDeadline
                    ? new Date(data.originalDeadline).toLocaleDateString()
                    : "Not set"}
                </p>
              </div>
              <div className="rounded-xl border border-pending/40 bg-pending/10 p-3">
                <p className="text-xs text-amber-800">Proposed deadline</p>
                <p className="font-medium text-amber-950">
                  {data.proposedDeadline
                    ? new Date(data.proposedDeadline).toLocaleDateString()
                    : "Not set"}
                </p>
                <p className="text-xs text-amber-800">
                  +{data.additionalWorkingDays} working days
                </p>
              </div>
            </section>
            {data.paymentTerms && (
              <section>
                <h3 className="mb-1 font-display font-semibold">Payment terms</h3>
                <p className="text-muted-foreground">{data.paymentTerms}</p>
              </section>
            )}
            {data.scopeExcerpt && (
              <section>
                <h3 className="mb-1 font-display font-semibold">Original scope reference</h3>
                <p className="whitespace-pre-wrap rounded-xl bg-secondary p-3 text-xs text-muted-foreground">
                  {data.scopeExcerpt}
                </p>
              </section>
            )}
            <p className="text-xs text-muted-foreground">{data.legalNotice}</p>
            <a
              className="inline-block text-sm font-semibold text-primary underline underline-offset-4"
              href={`/api/v1/client/proposals/${token}?download=pdf`}
            >
              Download PDF
            </a>
          </CardContent>
        </Card>

        {!decided && (
          <Card className="border-primary/20 shadow-glow">
            <CardHeader>
              <CardTitle className="font-display text-lg font-bold">Your decision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Your name (optional)</Label>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="As it should appear on the record"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="comment">Comment or clarification</Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  placeholder="Optional"
                />
              </div>
              <label className="flex items-start gap-3 text-sm">
                <Checkbox
                  checked={confirmed}
                  onCheckedChange={(v) => setConfirmed(Boolean(v))}
                />
                <span>
                  I have reviewed this proposal and accept the additional work, price (
                  {data.total}), and timeline impact described above.
                </span>
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  className="flex-1"
                  disabled={submitting}
                  onClick={() => void decide("approved")}
                >
                  Approve
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={submitting}
                  onClick={() => void decide("rejected")}
                >
                  Reject
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  disabled={submitting}
                  onClick={() => void decide("clarification_requested")}
                >
                  Request clarification
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
