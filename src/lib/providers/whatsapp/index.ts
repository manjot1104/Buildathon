import { createHmac, timingSafeEqual } from "crypto";
import { getEnv, isWhatsAppConfigured } from "@/lib/config/env";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { connectDb } from "@/lib/db/connection";
import { WebhookEvent } from "@/models";

export interface WhatsAppProvider {
  isConnected(): boolean;
  sendTemplateMessage(input: {
    toE164: string;
    templateName: string;
    languageCode?: string;
    components?: unknown[];
  }): Promise<{ ok: boolean; messageId?: string; error?: string }>;
  verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean;
  recordWebhookEvent(input: {
    eventId: string;
    eventType: string;
    payload: unknown;
  }): Promise<{ duplicate: boolean }>;
}

class UnconfiguredWhatsAppProvider implements WhatsAppProvider {
  isConnected() {
    return false;
  }
  async sendTemplateMessage() {
    return {
      ok: false,
      error: "WhatsApp Cloud API is not connected. Configure WHATSAPP_* env vars.",
    };
  }
  verifyWebhookSignature() {
    return false;
  }
  async recordWebhookEvent() {
    return { duplicate: false };
  }
}

class CloudApiWhatsAppProvider implements WhatsAppProvider {
  isConnected() {
    return true;
  }

  async sendTemplateMessage(input: {
    toE164: string;
    templateName: string;
    languageCode?: string;
    components?: unknown[];
  }) {
    const env = getEnv();
    const url = `https://graph.facebook.com/v21.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: input.toE164.replace(/\D/g, ""),
          type: "template",
          template: {
            name: input.templateName,
            language: { code: input.languageCode ?? "en" },
            components: input.components ?? [],
          },
        }),
      });
      const json = (await res.json()) as {
        messages?: Array<{ id: string }>;
        error?: { message?: string };
      };
      if (!res.ok) {
        return { ok: false, error: json.error?.message ?? "WhatsApp send failed" };
      }
      return { ok: true, messageId: json.messages?.[0]?.id };
    } catch (err) {
      logger.error({ err }, "WhatsApp send failed");
      return { ok: false, error: "WhatsApp send failed" };
    }
  }

  verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
    const env = getEnv();
    if (!env.WHATSAPP_APP_SECRET || !signatureHeader?.startsWith("sha256=")) {
      return false;
    }
    const expected = createHmac("sha256", env.WHATSAPP_APP_SECRET)
      .update(rawBody)
      .digest("hex");
    const provided = signatureHeader.slice("sha256=".length);
    try {
      return timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
    } catch {
      return false;
    }
  }

  async recordWebhookEvent(input: {
    eventId: string;
    eventType: string;
    payload: unknown;
  }) {
    await connectDb();
    try {
      await WebhookEvent.create({
        provider: "whatsapp",
        eventId: input.eventId,
        eventType: input.eventType,
        payloadHash: createHmac("sha256", "whatsapp")
          .update(JSON.stringify(input.payload))
          .digest("hex"),
        status: "processed",
      });
      return { duplicate: false };
    } catch (err) {
      if ((err as { code?: number }).code === 11000) {
        return { duplicate: true };
      }
      throw err;
    }
  }
}

export function getWhatsAppProvider(): WhatsAppProvider {
  return isWhatsAppConfigured()
    ? new CloudApiWhatsAppProvider()
    : new UnconfiguredWhatsAppProvider();
}

export function assertWhatsAppConnected() {
  if (!isWhatsAppConfigured()) {
    throw new AppError(
      "INTEGRATION_UNAVAILABLE",
      "WhatsApp is not connected. Use manual message pasting or configure the Cloud API."
    );
  }
}
