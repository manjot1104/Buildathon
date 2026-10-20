"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { MoneyText } from "@/components/shared/money-text";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { appGet } from "@/lib/api/app-fetch";

type ProjectDetail = {
  id: string;
  name: string;
  description?: string;
  status: string;
  currency: string;
  originalPriceMinor?: number;
  pricingModel?: string;
  deadline?: string | null;
  client?: { id: string; name: string; email?: string };
  scope?: { id: string; versionNumber: number } | null;
};

export default function ProjectOverviewPage({ params }: { params: { projectId: string } }) {
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const res = await appGet<ProjectDetail>(`/api/v1/projects/${params.projectId}`);
      if (!res.ok) setError(res.message);
      else setProject(res.data);
      setLoading(false);
    })();
  }, [params.projectId]);

  if (loading) return <LoadingState label="Loading project…" />;
  if (error) return <ErrorState message={error} />;
  if (!project) return <ErrorState message="Project not found." />;

  return (
    <div>
      <PageHeader
        title={project.name}
        description={project.description ?? "Project overview"}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={`/app/projects/${params.projectId}/requests/new`}>New request</Link>
            </Button>
            <Button asChild>
              <Link href={`/app/projects/${params.projectId}/scope`}>Manage scope</Link>
            </Button>
          </>
        }
        breadcrumbs={[
          { label: "Projects", href: "/app/projects" },
          { label: project.name },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge status={project.status} />
            </div>
            {project.client ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Client</span>
                <Link href={`/app/clients/${project.client.id}`} className="font-medium hover:text-primary">
                  {project.client.name}
                </Link>
              </div>
            ) : null}
            {project.originalPriceMinor != null ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Original price</span>
                <MoneyText amountMinor={project.originalPriceMinor} currency={project.currency} />
              </div>
            ) : null}
            {project.deadline ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deadline</span>
                <span>{new Date(project.deadline).toLocaleDateString()}</span>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Scope</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {project.scope ? (
              <p>
                Current version <strong>v{project.scope.versionNumber}</strong>.{" "}
                <Link href={`/app/projects/${params.projectId}/scope`} className="text-primary hover:underline">
                  View scope
                </Link>
              </p>
            ) : (
              <p className="text-muted-foreground">
                No scope defined yet.{" "}
                <Link href={`/app/projects/${params.projectId}/scope`} className="text-primary hover:underline">
                  Add scope
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
