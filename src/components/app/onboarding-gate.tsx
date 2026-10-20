"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function OnboardingGate({ onboardingCompleted }: { onboardingCompleted: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const onOnboarding = pathname === "/app/onboarding" || pathname.startsWith("/app/onboarding/");

  useEffect(() => {
    if (!onboardingCompleted && !onOnboarding) {
      router.replace("/app/onboarding");
      return;
    }
    if (onboardingCompleted && onOnboarding) {
      router.replace("/app");
    }
  }, [onboardingCompleted, onOnboarding, router]);

  return null;
}
