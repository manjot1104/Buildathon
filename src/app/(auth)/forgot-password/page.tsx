import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password",
};

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset password"
      description="Enter your email and we'll send a link if an account exists."
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
