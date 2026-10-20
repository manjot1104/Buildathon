"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { appGet } from "@/lib/api/app-fetch";

type ClientItem = {
  id: string;
  name: string;
  email?: string | null;
  company?: string | null;
  phone?: string | null;
  preferredChannel?: string;
};

type ProjectItem = {
  id: string;
  name: string;
  status: string;
  clientId: string;
};

export default function ClientDetailPage({ params }: { params: { clientId: string } }) {
  const [client, setClient] = useState<ClientItem | null>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const [clientsRes, projectsRes] = await Promise.all([
        appGet<{ items: ClientItem[] }>("/api/v1/clients"),
        appGet<{ items: ProjectItem[] }>("/api/v1/projects"),
      ]);
      if (!clientsRes.ok) {
        setError(clientsRes.message);
      } else {
        const found = clientsRes.data.items.find((c) => c.id === params.clientId);
        if (!found) setError("Client not found.");
        else setClient(found);
      }
      if (projectsRes.ok) {
        setProjects(projectsRes.data.items.filter((p) => p.clientId === params.clientId));
      }
      setLoading(false);
    })();
  }, [params.clientId]);

  if (loading) return <LoadingState label="Loading client…" />;
  if (error) return <ErrorState message={error} />;
  if (!client) return <ErrorState message="Client not found." />;

  return (
    <div>
      <PageHeader
        title={client.name}
        breadcrumbs={[{ label: "Clients", href: "/app/clients" }, { label: client.name }]}
      />

      <Card className="mb-6">
        <CardContent className="space-y-2 pt-6 text-sm">
          {client.company ? (
            <p>
              <span className="text-muted-foreground">Company:</span> {client.company}
            </p>
          ) : null}
          {client.email ? (
            <p>
              <span className="text-muted-foreground">Email:</span> {client.email}
            </p>
          ) : null}
          {client.phone ? (
            <p>
              <span className="text-muted-foreground">Phone:</span> {client.phone}
            </p>
          ) : null}
          {client.preferredChannel ? (
            <p>
              <span className="text-muted-foreground">Preferred channel:</span> {client.preferredChannel}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <h2 className="mb-3 text-lg font-semibold">Projects</h2>
      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">No projects for this client yet.</p>
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {projects.map((p) => (
            <li key={p.id}>
              <Link href={`/app/projects/${p.id}`} className="block px-4 py-3 hover:bg-muted/40">
                {p.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
