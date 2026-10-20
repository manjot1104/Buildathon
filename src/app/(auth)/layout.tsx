import { AuthLogo } from "@/components/auth/auth-shell";
import { AuroraBg } from "@/components/motion/aurora-bg";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <AuroraBg variant="auth" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background-image:radial-gradient(hsl(var(--foreground)/0.04)_1px,transparent_1px)] [background-size:22px_22px]"
      />
      <div className="relative z-[1] mb-8">
        <AuthLogo />
      </div>
      <div className="relative z-[1] w-full max-w-md">{children}</div>
    </div>
  );
}
