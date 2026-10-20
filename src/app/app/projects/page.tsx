"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FolderKanban, PlusCircle } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { appGet } from "@/lib/api/app-fetch";

type ProjectItem = {
  id: string;
  name: string;
  status: string;
  client?: { id: string; name: string };
  updatedAt: string;
};

export default function ProjectsPage() {
  const [items, setItems] = useState<ProjectItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const res = await appGet<{ items: ProjectItem[] }>("/api/v1/projects");
      if (!res.ok) setError(res.message);
      else setItems(res.data.items);
      setLoading(false);
    })();
  }, []);

  if (loading) return <LoadingState label="Loading projects…" />;
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Manage scoped work and client change requests."
        actions={
          <Button asChild>
            <Link href="/app/projects/new">
              <PlusCircle className="size-4" />
              New project
            </Link>
          </Button>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create a project to define scope and track extra work."
          action={
            <Button asChild>
              <Link href="/app/projects/new">Create project</Link>
            </Button>
          }
        />
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {items.map((p) => (
            <li key={p.id}>
              <Link
                href={`/app/projects/${p.id}`}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-muted/40"
              >
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {p.client?.name ?? "Client"} · Updated {new Date(p.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={p.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
