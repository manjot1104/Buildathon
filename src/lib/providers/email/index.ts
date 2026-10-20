import nodemailer from "nodemailer";
import { getEnv, isEmailConfigured } from "@/lib/config/env";
import { logger } from "@/lib/logger";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailSendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<EmailSendResult>;
}

class ConsoleEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<EmailSendResult> {
    logger.info(
      { to: message.to, subject: message.subject, preview: message.text.slice(0, 200) },
      "[email:console] Message not sent — SMTP not configured"
    );
    return { ok: true, messageId: `console-${Date.now()}` };
  }
}

class SmtpEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<EmailSendResult> {
    const env = getEnv();
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 587,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS ?? "" }
        : undefined,
    });

    try {
      const info = await transporter.sendMail({
        from: env.EMAIL_FROM,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      });
      return { ok: true, messageId: info.messageId };
    } catch (err) {
      const error = err instanceof Error ? err.message : "SMTP error";
      logger.error({ err }, "SMTP send failed");
      return { ok: false, error };
    }
  }
}

export function getEmailProvider(): EmailProvider {
  return isEmailConfigured() ? new SmtpEmailProvider() : new ConsoleEmailProvider();
}
