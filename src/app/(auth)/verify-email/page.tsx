import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthCard } from "@/components/auth/auth-shell";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";

export const metadata: Metadata = {
  title: "Verify email",
};

function VerifyFallback() {
  return <p className="text-sm text-muted-foreground">Loading…</p>;
}

export default function VerifyEmailPage() {
  return (
    <AuthCard title="Verify your email" description="Confirm your address to secure your account.">
      <Suspense fallback={<VerifyFallback />}>
        <VerifyEmailForm />
      </Suspense>
    </AuthCard>
  );
}
