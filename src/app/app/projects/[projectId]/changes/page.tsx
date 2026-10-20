"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Clock, GitPullRequest } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { MoneyText } from "@/components/shared/money-text";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageAtmosphere } from "@/components/motion/page-atmosphere";
import { appGet } from "@/lib/api/app-fetch";
import { cn } from "@/lib/utils/cn";

type ProposalItem = {
  id: string;
  proposalNumber: string;
  title: string;
  status: string;
  totalMinor: number;
  currency: string;
  requestId: string;
};

const pendingStatuses = new Set(["sent", "pending", "awaiting_client", "clarification_requested"]);

export default function ProjectChangesPage({ params }: { params: { projectId: string } }) {
  const [items, setItems] = useState<ProposalItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const res = await appGet<{ items: ProposalItem[] }>(
        `/api/v1/proposals?projectId=${params.projectId}`
      );
      if (!res.ok) setError(res.message);
      else setItems(res.data.items);
      setLoading(false);
    })();
  }, [params.projectId]);

  if (loading) return <LoadingState label="Loading proposals…" />;
  if (error) return <ErrorState message={error} />;

  const pendingCount = items.filter((p) => pendingStatuses.has(p.status.toLowerCase())).length;

  return (
    <PageAtmosphere kind={pendingCount > 0 ? "pending" : "default"} showLabel={pendingCount > 0}>
      <PageHeader
        title="Scope changes"
        description="Proposals and client decisions for this project."
      />

      {items.length === 0 ? (
        <EmptyState
          icon={GitPullRequest}
          title="No change proposals"
          description="Create a proposal from a client request when work is out of scope."
        />
      ) : (
        <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border bg-card/90 shadow-sm">
          {items.map((p) => {
            const pending = pendingStatuses.has(p.status.toLowerCase());
            return (
              <li
                key={p.id}
                className={cn(
                  "flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 transition-colors",
                  pending && "bg-pending/5"
                )}
              >
                <div>
                  <p className="flex items-center gap-2 font-medium">
                    {pending ? <Clock className="size-3.5 text-pending" /> : null}
                    {p.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{p.proposalNumber}</p>
                  <Link
                    href={`/app/projects/${params.projectId}/requests/${p.requestId}`}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    View request
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={p.status} />
                  <span className={cn("font-semibold", pending ? "text-pending" : "text-money")}>
                    <MoneyText amountMinor={p.totalMinor} currency={p.currency} />
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </PageAtmosphere>
  );
}
