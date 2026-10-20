import { getEnv } from "@/lib/config/env";

export function renderEmailTemplate(
  template: string,
  data: Record<string, string>
): { subject: string; html: string; text: string } {
  const app = getEnv().APP_NAME;

  switch (template) {
    case "verify_email":
      return wrap(
        `Verify your ${app} email`,
        `Hi ${data.name ?? "there"},\n\nConfirm your email: ${data.verifyUrl}\n\nThis link expires in 24 hours.`,
        `<p>Hi ${escapeHtml(data.name ?? "there")},</p><p><a href="${escapeAttr(data.verifyUrl ?? "")}">Confirm your email</a></p><p>This link expires in 24 hours.</p>`
      );
    case "password_reset":
      return wrap(
        `Reset your ${app} password`,
        `Hi ${data.name ?? "there"},\n\nReset your password: ${data.resetUrl}\n\nIf you did not request this, ignore this email.`,
        `<p>Hi ${escapeHtml(data.name ?? "there")},</p><p><a href="${escapeAttr(data.resetUrl ?? "")}">Reset your password</a></p><p>If you did not request this, ignore this email.</p>`
      );
    case "proposal_sent":
      return wrap(
        `Change proposal: ${data.projectName ?? "Project"}`,
        `${data.workspaceName ?? "Your freelancer"} sent a change proposal for ${data.projectName}.\n\nReview and respond: ${data.approveUrl}\n\nAmount: ${data.amount ?? ""}\n`,
        `<p><strong>${escapeHtml(data.workspaceName ?? "Your freelancer")}</strong> sent a change proposal for <strong>${escapeHtml(data.projectName ?? "your project")}</strong>.</p><p>Amount: ${escapeHtml(data.amount ?? "")}</p><p><a href="${escapeAttr(data.approveUrl ?? "")}">Review and respond</a></p>`
      );
    case "proposal_decision":
      return wrap(
        `Proposal ${data.decision}: ${data.projectName ?? "Project"}`,
        `Client ${data.decision} the proposal for ${data.projectName}.\n\n${data.comment ?? ""}\n\nOpen: ${data.href ?? ""}`,
        `<p>Client <strong>${escapeHtml(data.decision ?? "")}</strong> the proposal for <strong>${escapeHtml(data.projectName ?? "")}</strong>.</p><p>${escapeHtml(data.comment ?? "")}</p><p><a href="${escapeAttr(data.href ?? "")}">Open in ScopePilot</a></p>`
      );
    case "team_invite":
      return wrap(
        `You're invited to ${data.workspaceName ?? "a workspace"} on ${app}`,
        `${data.inviterName} invited you to join ${data.workspaceName}.\n\nAccept: ${data.inviteUrl}`,
        `<p>${escapeHtml(data.inviterName ?? "A teammate")} invited you to join <strong>${escapeHtml(data.workspaceName ?? "")}</strong>.</p><p><a href="${escapeAttr(data.inviteUrl ?? "")}">Accept invitation</a></p>`
      );
    default:
      return wrap(
        data.subject ?? `${app} notification`,
        data.body ?? "",
        `<p>${escapeHtml(data.body ?? "")}</p>`
      );
  }
}

function wrap(subject: string, text: string, innerHtml: string) {
  const app = getEnv().APP_NAME;
  const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;color:#0f172a;line-height:1.5"><div style="max-width:560px;margin:0 auto;padding:24px"><div style="font-weight:700;color:#1e3a8a;margin-bottom:16px">${escapeHtml(app)}</div>${innerHtml}<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/><p style="color:#64748b;font-size:12px">This message was sent by ${escapeHtml(app)}.</p></div></body></html>`;
  return { subject, html, text };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s: string) {
  return escapeHtml(s).replace(/'/g, "&#39;");
}
