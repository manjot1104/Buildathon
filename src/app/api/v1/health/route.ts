import { jsonOk } from "@/lib/api/response";
import { connectDb } from "@/lib/db/connection";
import {
  isAiConfigured,
  isBillingConfigured,
  isEmailConfigured,
  isWhatsAppConfigured,
} from "@/lib/config/env";

export const dynamic = "force-dynamic";

export async function GET() {
  let db: "ok" | "error" = "ok";
  try {
    await connectDb();
  } catch {
    db = "error";
  }

  return jsonOk({
    status: db === "ok" ? "ready" : "degraded",
    db,
    integrations: {
      email: isEmailConfigured() ? "configured" : "not_connected",
      ai: isAiConfigured() ? "configured" : "not_connected",
      whatsapp: isWhatsAppConfigured() ? "configured" : "not_connected",
      billing: isBillingConfigured() ? "configured" : "not_connected",
    },
    timestamp: new Date().toISOString(),
  });
}
