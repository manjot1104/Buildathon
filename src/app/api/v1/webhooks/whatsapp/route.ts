import { jsonOk, jsonError } from "@/lib/api/response";
import { getEnv, isWhatsAppConfigured } from "@/lib/config/env";
import { getWhatsAppProvider } from "@/lib/providers/whatsapp";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";

export async function GET(req: Request) {
  const env = getEnv();
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && token === env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(req: Request) {
  try {
    if (!isWhatsAppConfigured()) {
      throw new AppError("INTEGRATION_UNAVAILABLE", "WhatsApp is not configured");
    }
    const rawBody = await req.text();
    const provider = getWhatsAppProvider();
    const signature = req.headers.get("x-hub-signature-256");
    if (!provider.verifyWebhookSignature(rawBody, signature)) {
      throw new AppError("FORBIDDEN", "Invalid webhook signature");
    }

    const payload = JSON.parse(rawBody) as {
      entry?: Array<{ id?: string; changes?: unknown[] }>;
    };
    const eventId =
      payload.entry?.[0]?.id ?? `wa-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const { duplicate } = await provider.recordWebhookEvent({
      eventId,
      eventType: "whatsapp.webhook",
      payload,
    });
    if (duplicate) {
      logger.info({ eventId }, "Duplicate WhatsApp webhook ignored");
    }
    return jsonOk({ received: true, duplicate });
  } catch (err) {
    return jsonError(err);
  }
}
