"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { appGet, appPost } from "@/lib/api/app-fetch";

type NotificationItem = {
  id: string;
  title: string;
  body?: string;
  href?: string | null;
  readAt: string | null;
  createdAt: string;
};

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await appGet<{ items: NotificationItem[]; unreadCount: number }>(
      "/api/v1/notifications"
    );
    if (!res.ok) setError(res.message);
    else {
      setError(null);
      setItems(res.data.items);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function markAllRead() {
    const res = await appPost("/api/v1/notifications", { all: true });
    if (!res.ok) setError(res.message);
    else await load();
  }

  if (loading) return <LoadingState label="Loading notifications…" />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <div>
      <PageHeader
        title="Notifications"
        actions={
          items.some((n) => !n.readAt) ? (
            <Button variant="outline" size="sm" onClick={() => void markAllRead()}>
              Mark all read
            </Button>
          ) : null
        }
      />

      {items.length === 0 ? (
        <EmptyState icon={Bell} title="All caught up" description="You have no notifications." />
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li
              key={n.id}
              className={`rounded-md border px-4 py-3 text-sm ${n.readAt ? "bg-card" : "border-primary/20 bg-primary/5"}`}
            >
              <p className="font-medium">{n.title}</p>
              {n.body ? <p className="text-muted-foreground">{n.body}</p> : null}
              <p className="mt-1 text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
