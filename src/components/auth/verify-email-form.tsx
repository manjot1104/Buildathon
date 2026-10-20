"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { postAuthJson } from "@/lib/auth/client-api";

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    token ? "loading" : "idle"
  );
  const [message, setMessage] = useState<string | null>(
    token ? null : "Open the verification link from your email to activate this step."
  );

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      const result = await postAuthJson<{ ok: boolean }>("/api/v1/auth/verify-email", { token });
      if (cancelled) return;
      if (!result.ok) {
        setStatus("error");
        setMessage(result.message);
        return;
      }
      setStatus("success");
      setMessage("Your email is verified. You can continue to the app.");
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="space-y-4 text-sm">
      {status === "loading" ? (
        <p className="text-muted-foreground" role="status">
          Verifying your email…
        </p>
      ) : null}
      {message ? (
        <p
          className={
            status === "error"
              ? "rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-destructive"
              : "rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-foreground"
          }
          role={status === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      ) : null}
      {status === "success" ? (
        <Button className="w-full" onClick={() => router.push("/app/onboarding")}>
          Continue to onboarding
        </Button>
      ) : (
        <Button variant="outline" className="w-full" asChild>
          <Link href="/login">Back to sign in</Link>
        </Button>
      )}
    </div>
  );
}
