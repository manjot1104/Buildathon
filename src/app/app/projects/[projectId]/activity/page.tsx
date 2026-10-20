"use client";

import { useEffect, useState } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { appGet } from "@/lib/api/app-fetch";

type Activity = {
  id: string;
  summary: string;
  eventType: string;
  createdAt: string;
  entityId: string | null;
};

export default function ProjectActivityPage({ params }: { params: { projectId: string } }) {
  const [items, setItems] = useState<Activity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const res = await appGet<{ recentActivity: Activity[] }>("/api/v1/dashboard");
      if (!res.ok) {
        setError(res.message);
      } else {
        const filtered = res.data.recentActivity.filter(
          (a) => a.entityId === params.projectId
        );
        setItems(filtered.length > 0 ? filtered : res.data.recentActivity.slice(0, 10));
      }
      setLoading(false);
    })();
  }, [params.projectId]);

  if (loading) return <LoadingState label="Loading activity…" />;
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      <PageHeader
        title="Activity"
        description="Recent workspace events related to this project when available."
      />

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((a) => (
            <li key={a.id} className="rounded-md border bg-card px-3 py-2 text-sm">
              <p>{a.summary}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(a.createdAt).toLocaleString()} · {a.eventType}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
