import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthCard } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password",
};

function ResetPasswordFallback() {
  return <p className="text-sm text-muted-foreground">Loading…</p>;
}

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Choose a new password" description="Use at least 8 characters.">
      <Suspense fallback={<ResetPasswordFallback />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
