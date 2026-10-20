import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Login disabled — jump straight into the app (open-access demo). */
export default function LoginPage() {
  redirect("/api/v1/auth/demo");
}
