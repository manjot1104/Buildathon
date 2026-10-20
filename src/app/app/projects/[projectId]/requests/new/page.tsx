"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { appPost } from "@/lib/api/app-fetch";

export default function NewRequestPage({ params }: { params: { projectId: string } }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [originalMessage, setOriginalMessage] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await appPost<{ id: string }>(`/api/v1/projects/${params.projectId}/requests`, {
      title: title.trim(),
      originalMessage: originalMessage.trim() || undefined,
      description: description.trim() || undefined,
      priority,
      sourceChannel: "other",
    });

    if (!res.ok) {
      setError(res.message);
      setSubmitting(false);
      return;
    }

    router.push(`/app/projects/${params.projectId}/requests/${res.data.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="New client request"
        breadcrumbs={[
          { label: "Requests", href: `/app/projects/${params.projectId}/requests` },
          { label: "New" },
        ]}
      />

      {error ? <ErrorState message={error} className="mb-4" /> : null}

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Original client message</Label>
              <Textarea
                id="message"
                value={originalMessage}
                onChange={(e) => setOriginalMessage(e.target.value)}
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Internal description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating…" : "Create request"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/app/projects/${params.projectId}/requests`}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
