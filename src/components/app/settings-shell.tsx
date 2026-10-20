import { PageHeader } from "@/components/shared/page-header";

export function SettingsShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={title} description={description} />
      {children}
    </div>
  );
}
