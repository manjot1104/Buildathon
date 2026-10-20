"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { appGet, appPost } from "@/lib/api/app-fetch";

type ClientItem = { id: string; name: string; email?: string | null };

export default function NewProjectPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [clientId, setClientId] = useState("");
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    void (async () => {
      const res = await appGet<{ items: ClientItem[] }>("/api/v1/clients");
      if (!res.ok) setError(res.message);
      else setClients(res.data.items);
      setLoading(false);
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    let resolvedClientId = clientId;
    if (showNewClient) {
      const clientRes = await appPost<{ id: string }>("/api/v1/clients", {
        name: newClientName,
        email: newClientEmail || null,
      });
      if (!clientRes.ok) {
        setError(clientRes.message);
        setSubmitting(false);
        return;
      }
      resolvedClientId = clientRes.data.id;
    }

    if (!resolvedClientId || !name.trim()) {
      setError("Client and project name are required.");
      setSubmitting(false);
      return;
    }

    const projectRes = await appPost<{ id: string }>("/api/v1/projects", {
      clientId: resolvedClientId,
      name: name.trim(),
      description: description.trim() || undefined,
      status: "active",
    });

    if (!projectRes.ok) {
      setError(projectRes.message);
      setSubmitting(false);
      return;
    }

    router.push(`/app/projects/${projectRes.data.id}`);
  }

  if (loading) return <LoadingState label="Loading clients…" />;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="New project"
        breadcrumbs={[
          { label: "Projects", href: "/app/projects" },
          { label: "New project" },
        ]}
      />

      {error && !submitting ? <ErrorState message={error} className="mb-4" /> : null}

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div className="space-y-2">
              <Label>Client</Label>
              {!showNewClient ? (
                <div className="flex gap-2">
                  <Select
                    className="flex-1"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    required={!showNewClient}
                  >
                    <option value="">Select client</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                  <Button type="button" variant="outline" onClick={() => setShowNewClient(true)}>
                    New client
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 rounded-md border p-3">
                  <div className="space-y-2">
                    <Label htmlFor="clientName">Client name</Label>
                    <Input
                      id="clientName"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientEmail">Email (optional)</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={newClientEmail}
                      onChange={(e) => setNewClientEmail(e.target.value)}
                    />
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowNewClient(false)}>
                    Use existing client
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Project name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating…" : "Create project"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/app/projects">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
