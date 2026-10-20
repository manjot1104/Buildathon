"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ContactForm() {
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold">Message received</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Thanks for reaching out. Inbox delivery is not wired in early access—your message was captured
          locally for this demo. Email{" "}
          <a href="mailto:hello@scopepilot.app" className="font-medium text-primary hover:underline">
            hello@scopepilot.app
          </a>{" "}
          for a direct response.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border bg-card p-6 shadow-sm"
      aria-labelledby="contact-form-title"
    >
      <h2 id="contact-form-title" className="font-display text-lg font-semibold">
        Send a message
      </h2>
      <div className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="contact-name">Name</Label>
          <Input id="contact-name" name="name" required autoComplete="name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email">Work email</Label>
          <Input id="contact-email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-subject">Subject</Label>
          <Input id="contact-subject" name="subject" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-message">Message</Label>
          <textarea
            id="contact-message"
            name="message"
            required
            rows={5}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>
      <Button type="submit" className="mt-6 w-full">
        Send message
      </Button>
    </form>
  );
}
