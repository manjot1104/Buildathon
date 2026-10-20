"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Clock,
  FolderPlus,
  Inbox,
  LayoutDashboard,
  PlusCircle,
  Wallet,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { MoneyText } from "@/components/shared/money-text";
import { StatusBadge } from "@/components/shared/status-badge";
import { CountUp } from "@/components/motion/count-up";
import { PageAtmosphere } from "@/components/motion/page-atmosphere";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { appGet } from "@/lib/api/app-fetch";
import { cn } from "@/lib/utils/cn";

type DashboardData = {
  cards: {
    activeProjects: number;
    requestsAwaitingReview: number;
    proposalsAwaitingClientApproval: number;
    approvedExtraWorkNotCompleted: number;
    overduePaymentItems: number;
  };
  finances: {
    proposedAmountMinor: number;
    clientApprovedAmountMinor: number;
    invoicedAmountMinor: number;
    paidAmountMinor: number;
    outstandingAmountMinor: number;
  };
  recentActivity: Array<{
    id: string;
    eventType: string;
    summary: string;
    createdAt: string;
    entityType: string | null;
    entityId: string | null;
  }>;
  pendingClientDecisions: Array<{
    id: string;
    proposalNumber: string;
    title: string;
    status: string;
    totalMinor: number;
    currency: string;
    projectId: string;
  }>;
  projectsRequiringAttention: Array<{
    id: string;
    name: string;
    status: string;
    deadline: string | null;
  }>;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const res = await appGet<DashboardData>("/api/v1/dashboard");
      if (!res.ok) {
        setError(res.message);
      } else {
        setData(res.data);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <LoadingState label="Loading dashboard…" />;
  if (error) return <ErrorState message={error} />;
  if (!data) return <ErrorState message="Dashboard returned empty data." />;

  const currency = "INR";
  const hasPending = data.cards.proposalsAwaitingClientApproval > 0;
  const hasOverdue = data.cards.overduePaymentItems > 0;

  const kpiCards = [
    {
      label: "Active projects",
      value: data.cards.activeProjects,
      icon: LayoutDashboard,
      tone: "text-primary bg-primary/10",
    },
    {
      label: "Requests to review",
      value: data.cards.requestsAwaitingReview,
      icon: Inbox,
      tone: "text-sky-700 bg-sky-500/10",
    },
    {
      label: "Awaiting client approval",
      value: data.cards.proposalsAwaitingClientApproval,
      icon: Clock,
      tone: "text-amber-800 bg-pending/15",
      pending: true,
    },
    {
      label: "Approved work pending",
      value: data.cards.approvedExtraWorkNotCompleted,
      icon: FolderPlus,
      tone: "text-teal-800 bg-teal-500/10",
    },
    {
      label: "Overdue invoices",
      value: data.cards.overduePaymentItems,
      icon: AlertTriangle,
      tone: "text-rose-800 bg-rose-500/10",
      money: true,
    },
  ];

  return (
    <PageAtmosphere kind="dashboard">
      <PageHeader
        title="Dashboard"
        description="Overview of projects, client requests, and pending approvals."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/app/projects/new">
                <PlusCircle className="size-4" />
                New project
              </Link>
            </Button>
            <Button asChild>
              <Link href="/app/projects">View projects</Link>
            </Button>
          </>
        }
      />

      {(hasPending || hasOverdue) && (
        <div className="mb-6 flex flex-wrap gap-2">
          {hasPending ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-pending/40 bg-pending/10 px-3 py-1 text-xs font-semibold text-amber-900 animate-pending-pulse">
              <Clock className="size-3.5" />
              {data.cards.proposalsAwaitingClientApproval} pending client decision
              {data.cards.proposalsAwaitingClientApproval === 1 ? "" : "s"}
            </span>
          ) : null}
          {hasOverdue ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-rose-300/60 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-900">
              <Wallet className="size-3.5" />
              {data.cards.overduePaymentItems} overdue payment
              {data.cards.overduePaymentItems === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>
      )}

      <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {kpiCards.map((card) => (
          <StaggerItem key={card.label}>
            <Card
              className={cn(
                "overflow-hidden",
                card.pending && "border-pending/40 shadow-glow-amber",
                card.money && card.value > 0 && "border-rose-300/50"
              )}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.label}
                </CardTitle>
                <span className={cn("rounded-xl p-2", card.tone)}>
                  <card.icon className="size-4" aria-hidden />
                </span>
              </CardHeader>
              <CardContent>
                <p className="font-display text-3xl font-bold tabular-nums">
                  <CountUp value={card.value} />
                </p>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </Stagger>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Reveal>
          <Card className="border-money/20 bg-gradient-to-br from-money/5 via-card to-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-base font-bold">
                <Wallet className="size-4 text-money" />
                Finances (workspace)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Proposed</span>
                <MoneyText amountMinor={data.finances.proposedAmountMinor} currency={currency} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Client approved</span>
                <span className="font-semibold text-money">
                  <MoneyText
                    amountMinor={data.finances.clientApprovedAmountMinor}
                    currency={currency}
                  />
                </span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="font-medium text-muted-foreground">Outstanding</span>
                <span className="font-display text-lg font-bold text-pending">
                  <MoneyText
                    amountMinor={data.finances.outstandingAmountMinor}
                    currency={currency}
                  />
                </span>
              </div>
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={0.08}>
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base font-bold">Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button size="sm" asChild>
                <Link href="/app/projects/new">Create project</Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href="/app/projects">Log client request</Link>
              </Button>
            </CardContent>
          </Card>
        </Reveal>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 font-display text-lg font-bold">Recent activity</h2>
          {data.recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.recentActivity.map((a) => (
                <li
                  key={a.id}
                  className="rounded-xl border bg-card/80 px-3 py-2.5 text-sm transition-colors hover:bg-card"
                >
                  <p>{a.summary}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(a.createdAt).toLocaleString()} · {a.eventType}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
            Pending client decisions
            {hasPending ? (
              <span className="rounded-full bg-pending/20 px-2 py-0.5 text-xs font-semibold text-amber-900">
                waiting
              </span>
            ) : null}
          </h2>
          {data.pendingClientDecisions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing waiting on clients.</p>
          ) : (
            <ul className="space-y-2">
              {data.pendingClientDecisions.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-pending/30 bg-pending/5 px-3 py-2.5 text-sm"
                >
                  <div>
                    <Link
                      href={`/app/projects/${p.projectId}/changes`}
                      className="font-medium hover:text-primary"
                    >
                      {p.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">{p.proposalNumber}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={p.status} />
                    <MoneyText amountMinor={p.totalMinor} currency={p.currency} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {data.projectsRequiringAttention.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-lg font-bold">Projects requiring attention</h2>
          <ul className="space-y-2">
            {data.projectsRequiringAttention.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/app/projects/${p.id}`}
                  className="flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition-colors hover:bg-secondary/60"
                >
                  <span className="font-medium">{p.name}</span>
                  <StatusBadge status={p.status} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </PageAtmosphere>
  );
}
