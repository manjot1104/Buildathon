"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Users } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { appGet } from "@/lib/api/app-fetch";

type ClientItem = {
  id: string;
  name: string;
  email?: string | null;
  company?: string | null;
};

export default function ClientsPage() {
  const [items, setItems] = useState<ClientItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const res = await appGet<{ items: ClientItem[] }>("/api/v1/clients");
      if (!res.ok) setError(res.message);
      else setItems(res.data.items);
      setLoading(false);
    })();
  }, []);

  if (loading) return <LoadingState label="Loading clients…" />;
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      <PageHeader title="Clients" description="People and companies you deliver work for." />

      {items.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients"
          description="Clients are added when you create projects."
        />
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {items.map((c) => (
            <li key={c.id}>
              <Link href={`/app/clients/${c.id}`} className="block px-4 py-3 hover:bg-muted/40">
                <p className="font-medium">{c.name}</p>
                <p className="text-sm text-muted-foreground">
                  {[c.company, c.email].filter(Boolean).join(" · ") || "No contact details"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
