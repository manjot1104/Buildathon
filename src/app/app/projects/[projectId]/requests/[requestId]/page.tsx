"use client";

import { useCallback, useEffect, useState } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { MoneyText } from "@/components/shared/money-text";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { ANALYSIS_CLASSIFICATIONS } from "@/models/enums";
import { appGet, appPost } from "@/lib/api/app-fetch";

type LineItem = { description: string; quantity: string; unit: string; rate: string };

type RequestDetail = {
  id: string;
  projectId: string;
  title: string;
  originalMessage?: string;
  description?: string;
  status: string;
  analysis?: {
    classification: string;
    explanation: string;
    mode: string;
  } | null;
  proposals: Array<{
    id: string;
    proposalNumber: string;
    status: string;
    totalMinor: number;
    currency: string;
  }>;
};

type HealthIntegrations = {
  integrations: { ai: string };
};

export default function RequestDetailPage({
  params,
}: {
  params: { projectId: string; requestId: string };
}) {
  const [data, setData] = useState<RequestDetail | null>(null);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [classification, setClassification] = useState<string>(ANALYSIS_CLASSIFICATIONS[1]);
  const [explanation, setExplanation] = useState("");
  const [analysisBusy, setAnalysisBusy] = useState(false);

  const [proposalTitle, setProposalTitle] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", quantity: "1", unit: "item", rate: "" },
  ]);
  const [proposalBusy, setProposalBusy] = useState(false);
  const [createdProposalId, setCreatedProposalId] = useState<string | null>(null);
  const [approveUrl, setApproveUrl] = useState<string | null>(null);
  const [sendBusy, setSendBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [reqRes, healthRes] = await Promise.all([
      appGet<RequestDetail>(`/api/v1/requests/${params.requestId}`),
      appGet<HealthIntegrations>("/api/v1/health"),
    ]);
    if (!reqRes.ok) {
      setError(reqRes.message);
      setData(null);
    } else {
      setError(null);
      setData(reqRes.data);
      if (reqRes.data.analysis) {
        setClassification(reqRes.data.analysis.classification);
        setExplanation(reqRes.data.analysis.explanation);
      }
      setProposalTitle(reqRes.data.title ? `Change: ${reqRes.data.title}` : "");
    }
    if (healthRes.ok) {
      setAiAvailable(healthRes.data.integrations.ai === "configured");
    }
    setLoading(false);
  }, [params.requestId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submitManualAnalysis(e: React.FormEvent) {
    e.preventDefault();
    setAnalysisBusy(true);
    setError(null);
    const res = await appPost(`/api/v1/requests/${params.requestId}/analysis`, {
      mode: "manual",
      classification,
      explanation: explanation.trim(),
    });
    if (!res.ok) setError(res.message);
    else await load();
    setAnalysisBusy(false);
  }

  async function runAiAnalysis() {
    setAnalysisBusy(true);
    setError(null);
    const res = await appPost(`/api/v1/requests/${params.requestId}/analysis`, { mode: "ai" });
    if (!res.ok) setError(res.message);
    else await load();
    setAnalysisBusy(false);
  }

  function updateLineItem(index: number, patch: Partial<LineItem>) {
    setLineItems((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  async function createProposal(e: React.FormEvent) {
    e.preventDefault();
    setProposalBusy(true);
    setError(null);
    const parsed = lineItems
      .map((l) => ({
        description: l.description.trim(),
        quantity: Number(l.quantity),
        unit: l.unit.trim() || "item",
        rate: Number(l.rate),
      }))
      .filter((l) => l.description && !Number.isNaN(l.quantity) && !Number.isNaN(l.rate));

    if (!proposalTitle.trim() || parsed.length === 0) {
      setError("Proposal title and at least one valid line item are required.");
      setProposalBusy(false);
      return;
    }

    const res = await appPost<{ id: string }>("/api/v1/proposals", {
      requestId: params.requestId,
      title: proposalTitle.trim(),
      lineItems: parsed,
    });

    if (!res.ok) setError(res.message);
    else {
      setCreatedProposalId(res.data.id);
      await load();
    }
    setProposalBusy(false);
  }

  async function sendProposal(proposalId: string) {
    setSendBusy(true);
    setError(null);
    const res = await appPost<{ approveUrl: string }>(`/api/v1/proposals/${proposalId}/send`, {});
    if (!res.ok) setError(res.message);
    else {
      setApproveUrl(res.data.approveUrl);
      await load();
    }
    setSendBusy(false);
  }

  if (loading) return <LoadingState label="Loading request…" />;
  if (error && !data) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!data) return <ErrorState message="Request not found." />;

  const draftOrLatest = createdProposalId ?? data.proposals.find((p) => p.status === "draft")?.id;

  return (
    <div className="space-y-8">
      <PageHeader
        title={data.title}
        description={data.status.replace(/_/g, " ")}
        actions={<StatusBadge status={data.status} />}
      />

      {error ? <ErrorState message={error} className="mb-2" onRetry={() => void load()} /> : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {data.originalMessage ? (
            <p className="whitespace-pre-wrap rounded-md bg-muted/50 p-3">{data.originalMessage}</p>
          ) : null}
          {data.description ? <p className="text-muted-foreground">{data.description}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scope analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.analysis ? (
            <div className="rounded-md border bg-muted/30 p-3 text-sm">
              <p className="mb-1 font-medium capitalize">{data.analysis.classification.replace(/_/g, " ")}</p>
              <p>{data.analysis.explanation}</p>
              <p className="mt-2 text-xs text-muted-foreground">Mode: {data.analysis.mode}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No analysis yet.</p>
          )}

          <form onSubmit={(e) => void submitManualAnalysis(e)} className="space-y-3">
            <div className="space-y-2">
              <Label>Classification</Label>
              <Select value={classification} onChange={(e) => setClassification(e.target.value)}>
                {ANALYSIS_CLASSIFICATIONS.map((c) => (
                  <option key={c} value={c}>
                    {c.replace(/_/g, " ")}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="explanation">Explanation</Label>
              <Textarea
                id="explanation"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                rows={4}
                required
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={analysisBusy}>
                {analysisBusy ? "Saving…" : "Save manual analysis"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={!aiAvailable || analysisBusy}
                onClick={() => void runAiAnalysis()}
              >
                Run AI analysis
              </Button>
              {!aiAvailable ? (
                <span className="self-center text-xs text-muted-foreground">AI not configured</span>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Change proposal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.proposals.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {data.proposals.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded border px-3 py-2">
                  <span>
                    {p.proposalNumber}
                  </span>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={p.status} />
                    <MoneyText amountMinor={p.totalMinor} currency={p.currency} />
                    {p.status === "draft" ? (
                      <Button size="sm" disabled={sendBusy} onClick={() => void sendProposal(p.id)}>
                        Send
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          <form onSubmit={(e) => void createProposal(e)} className="space-y-3 border-t pt-4">
            <div className="space-y-2">
              <Label htmlFor="proposalTitle">Proposal title</Label>
              <Input
                id="proposalTitle"
                value={proposalTitle}
                onChange={(e) => setProposalTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Line items (rate in major currency units)</Label>
              {lineItems.map((row, i) => (
                <div key={i} className="grid gap-2 sm:grid-cols-4">
                  <Input
                    className="sm:col-span-2"
                    placeholder="Description"
                    value={row.description}
                    onChange={(e) => updateLineItem(i, { description: e.target.value })}
                  />
                  <Input
                    placeholder="Qty"
                    value={row.quantity}
                    onChange={(e) => updateLineItem(i, { quantity: e.target.value })}
                  />
                  <Input
                    placeholder="Rate"
                    value={row.rate}
                    onChange={(e) => updateLineItem(i, { rate: e.target.value })}
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setLineItems((rows) => [...rows, { description: "", quantity: "1", unit: "item", rate: "" }])
                }
              >
                Add line
              </Button>
            </div>
            <Button type="submit" disabled={proposalBusy}>
              {proposalBusy ? "Creating…" : "Create proposal draft"}
            </Button>
          </form>

          {draftOrLatest && !approveUrl ? (
            <Button variant="default" disabled={sendBusy} onClick={() => void sendProposal(draftOrLatest)}>
              {sendBusy ? "Sending…" : "Send latest draft to client"}
            </Button>
          ) : null}

          {approveUrl ? (
            <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
              <p className="font-medium">Client approval link</p>
              <p className="mt-1 break-all font-mono text-xs">{approveUrl}</p>
              <Button
                type="button"
                size="sm"
                className="mt-2"
                variant="outline"
                onClick={() => void navigator.clipboard.writeText(approveUrl)}
              >
                Copy link
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
