import { getEnv, isEmailConfigured } from "@/lib/config/env";
import { logger } from "@/lib/logger";
import { getEmailProvider } from "@/lib/providers/email";
import { renderEmailTemplate } from "@/lib/providers/email/templates";
import { runAiAnalysisJob } from "@/lib/services/analysis-service";

export async function processJob(
  type: string,
  payload: Record<string, unknown>
): Promise<void> {
  switch (type) {
    case "send_email": {
      const to = String(payload.to ?? "");
      const template = String(payload.template ?? "");
      const data = (payload.data ?? {}) as Record<string, string>;
      const { subject, html, text } = renderEmailTemplate(template, data);
      const provider = getEmailProvider();
      const result = await provider.send({ to, subject, html, text });
      if (!result.ok) {
        throw new Error(result.error ?? "Email send failed");
      }
      if (!isEmailConfigured()) {
        logger.info({ to, template, subject }, "Email logged (SMTP not configured)");
      }
      return;
    }
    case "ai_analysis": {
      await runAiAnalysisJob({
        analysisId: String(payload.analysisId),
        requestId: String(payload.requestId),
        workspaceId: String(payload.workspaceId),
        userId: String(payload.userId),
      });
      return;
    }
    case "noop":
      return;
    default:
      logger.warn({ type }, "Unknown job type");
      throw new Error(`Unknown job type: ${type}`);
  }
}

export function appBaseUrl(): string {
  return getEnv().APP_URL;
}
