"use client";

import { ProjectSubnav } from "@/components/app/project-subnav";

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { projectId: string };
}) {
  return (
    <div>
      <ProjectSubnav projectId={params.projectId} />
      {children}
    </div>
  );
}
