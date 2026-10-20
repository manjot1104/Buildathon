import { cookies } from "next/headers";
import { jsonOk, jsonError } from "@/lib/api/response";
import { getEnv } from "@/lib/config/env";
import { logoutUser } from "@/lib/services/auth-service";

export async function POST() {
  try {
    const env = getEnv();
    const raw = cookies().get(env.SESSION_COOKIE_NAME)?.value;
    await logoutUser(raw);
    return jsonOk({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
