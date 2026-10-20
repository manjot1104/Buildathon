"use client";

import { useCallback, useEffect, useState } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText } from "lucide-react";
import { appGet, appPost } from "@/lib/api/app-fetch";

type ScopeVersion = {
  id: string;
  versionNumber: number;
  label?: string;
  isCurrent?: boolean;
  objectives?: string;
  deliverables?: string[];
  exclusions?: string[];
  paymentTerms?: string;
  additionalWorkPolicy?: string;
};

export default function ProjectScopePage({ params }: { params: { projectId: string } }) {
  const [versions, setVersions] = useState<ScopeVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [objectives, setObjectives] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [exclusions, setExclusions] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [policy, setPolicy] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await appGet<{ versions: ScopeVersion[] }>(
      `/api/v1/projects/${params.projectId}/scope`
    );
    if (!res.ok) setError(res.message);
    else {
      setError(null);
      setVersions(res.data.versions);
    }
    setLoading(false);
  }, [params.projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createScope(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await appPost<{ id: string; versionNumber: number }>(
      `/api/v1/projects/${params.projectId}/scope`,
      {
        objectives: objectives.trim() || undefined,
        deliverables: deliverables
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        exclusions: exclusions
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        paymentTerms: paymentTerms.trim() || undefined,
        additionalWorkPolicy: policy.trim() || undefined,
      }
    );
    if (!res.ok) {
      setError(res.message);
      setSubmitting(false);
      return;
    }
    setObjectives("");
    setDeliverables("");
    setExclusions("");
    setPaymentTerms("");
    setPolicy("");
    setSubmitting(false);
    await load();
  }

  if (loading) return <LoadingState label="Loading scope…" />;

  return (
    <div>
      <PageHeader title="Scope" description="Define what is included in the original agreement." />

      {error ? <ErrorState message={error} className="mb-4" onRetry={() => void load()} /> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New scope version</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => void createScope(e)} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="objectives">Objectives</Label>
                <Textarea id="objectives" value={objectives} onChange={(e) => setObjectives(e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliverables">Deliverables (one per line)</Label>
                <Textarea id="deliverables" value={deliverables} onChange={(e) => setDeliverables(e.target.value)} rows={4} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exclusions">Exclusions (one per line)</Label>
                <Textarea id="exclusions" value={exclusions} onChange={(e) => setExclusions(e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment terms</Label>
                <Input id="paymentTerms" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="policy">Additional work policy</Label>
                <Textarea id="policy" value={policy} onChange={(e) => setPolicy(e.target.value)} rows={2} />
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving…" : "Create scope version"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Versions</h2>
          {versions.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No scope yet"
              description="Create the first scope version to analyze client requests against."
            />
          ) : (
            versions.map((v) => (
              <Card key={v.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Version {v.versionNumber}
                    {v.isCurrent ? " (current)" : ""}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {v.objectives ? <p>{v.objectives}</p> : null}
                  {v.deliverables?.length ? (
                    <ul className="list-inside list-disc text-muted-foreground">
                      {v.deliverables.map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ul>
                  ) : null}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
