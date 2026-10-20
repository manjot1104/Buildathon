import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Signup disabled — jump straight into the app (open-access demo). */
export default function RegisterPage() {
  redirect("/api/v1/auth/demo");
}
