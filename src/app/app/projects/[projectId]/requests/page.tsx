"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Inbox, PlusCircle } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { appGet } from "@/lib/api/app-fetch";

type RequestItem = {
  id: string;
  title: string;
  status: string;
  priority: string;
  updatedAt: string;
};

export default function ProjectRequestsPage({ params }: { params: { projectId: string } }) {
  const [items, setItems] = useState<RequestItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const res = await appGet<{ items: RequestItem[] }>(
        `/api/v1/projects/${params.projectId}/requests`
      );
      if (!res.ok) setError(res.message);
      else setItems(res.data.items);
      setLoading(false);
    })();
  }, [params.projectId]);

  if (loading) return <LoadingState label="Loading requests…" />;
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      <PageHeader
        title="Client requests"
        actions={
          <Button asChild>
            <Link href={`/app/projects/${params.projectId}/requests/new`}>
              <PlusCircle className="size-4" />
              New request
            </Link>
          </Button>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No requests"
          description="Log a client message to analyze scope impact."
          action={
            <Button asChild>
              <Link href={`/app/projects/${params.projectId}/requests/new`}>Add request</Link>
            </Button>
          }
        />
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {items.map((r) => (
            <li key={r.id}>
              <Link
                href={`/app/projects/${params.projectId}/requests/${r.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/40"
              >
                <div>
                  <p className="font-medium">{r.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.priority} priority · {new Date(r.updatedAt).toLocaleString()}
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
