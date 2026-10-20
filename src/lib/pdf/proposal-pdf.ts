import PDFDocument from "pdfkit";
import { formatMoney } from "@/lib/money";

export interface ProposalPdfData {
  proposalNumber: string;
  revision: number;
  workspaceName: string;
  clientName: string;
  projectName: string;
  title: string;
  additionalWorkDescription: string;
  whySeparate: string;
  deliverables: string[];
  exclusions: string[];
  lineItems: Array<{
    description: string;
    quantity: number;
    unit: string;
    rateMinor: number;
    amountMinor: number;
  }>;
  subtotalMinor: number;
  discountMinor: number;
  feesMinor: number;
  taxMinor: number;
  totalMinor: number;
  currency: string;
  additionalWorkingDays: number;
  originalDeadline: Date | null;
  proposedDeadline: Date | null;
  paymentTerms: string;
  scopeExcerpt: string;
  createdAt: Date;
  expiresAt: Date | null;
  decision?: {
    decision: string;
    at: Date;
    clientNameEntered?: string;
  };
}

export async function generateProposalPdf(data: ProposalPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fillColor("#1e3a8a").fontSize(20).text("ScopePilot", { continued: false });
    doc.fillColor("#0f172a").fontSize(14).text("Change Proposal", { underline: false });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#475569");
    doc.text(`Proposal ${data.proposalNumber} · Revision ${data.revision}`);
    doc.text(`Date: ${data.createdAt.toISOString().slice(0, 10)}`);
    if (data.expiresAt) doc.text(`Valid until: ${data.expiresAt.toISOString().slice(0, 10)}`);
    doc.moveDown();

    doc.fillColor("#0f172a").fontSize(11);
    doc.text(`From: ${data.workspaceName}`);
    doc.text(`To: ${data.clientName}`);
    doc.text(`Project: ${data.projectName}`);
    doc.moveDown();
    doc.fontSize(12).text(data.title, { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).text(data.additionalWorkDescription || "—");
    if (data.whySeparate) {
      doc.moveDown(0.5);
      doc.font("Helvetica-Oblique").text(`Why this is separate: ${data.whySeparate}`);
      doc.font("Helvetica");
    }

    if (data.deliverables.length) {
      doc.moveDown();
      doc.fontSize(11).text("Included deliverables");
      data.deliverables.forEach((d) => doc.fontSize(10).text(`• ${d}`));
    }
    if (data.exclusions.length) {
      doc.moveDown(0.5);
      doc.fontSize(11).text("Exclusions / assumptions");
      data.exclusions.forEach((d) => doc.fontSize(10).text(`• ${d}`));
    }

    doc.moveDown();
    doc.fontSize(11).text("Pricing");
    data.lineItems.forEach((item) => {
      doc
        .fontSize(10)
        .text(
          `${item.description} — ${item.quantity} ${item.unit} × ${formatMoney(item.rateMinor, data.currency)} = ${formatMoney(item.amountMinor, data.currency)}`
        );
    });
    doc.moveDown(0.5);
    doc.text(`Subtotal: ${formatMoney(data.subtotalMinor, data.currency)}`);
    if (data.discountMinor)
      doc.text(`Discount: -${formatMoney(data.discountMinor, data.currency)}`);
    if (data.feesMinor) doc.text(`Fees: ${formatMoney(data.feesMinor, data.currency)}`);
    if (data.taxMinor) doc.text(`Tax: ${formatMoney(data.taxMinor, data.currency)}`);
    doc.fontSize(12).text(`Total: ${formatMoney(data.totalMinor, data.currency)}`);

    doc.moveDown();
    doc.fontSize(11).text("Timeline");
    doc
      .fontSize(10)
      .text(
        `Additional working days: ${data.additionalWorkingDays}`
      );
    doc.text(
      `Original deadline: ${data.originalDeadline ? data.originalDeadline.toISOString().slice(0, 10) : "Not set"}`
    );
    doc.text(
      `Proposed deadline: ${data.proposedDeadline ? data.proposedDeadline.toISOString().slice(0, 10) : "Not set"}`
    );
    if (data.paymentTerms) {
      doc.moveDown(0.5);
      doc.text(`Payment terms: ${data.paymentTerms}`);
    }

    if (data.scopeExcerpt) {
      doc.moveDown();
      doc.fontSize(11).text("Original scope reference");
      doc.fontSize(9).fillColor("#475569").text(data.scopeExcerpt.slice(0, 1200));
      doc.fillColor("#0f172a");
    }

    if (data.decision) {
      doc.moveDown();
      doc.fontSize(11).fillColor("#166534").text("Decision record");
      doc
        .fillColor("#0f172a")
        .fontSize(10)
        .text(
          `${data.decision.decision.toUpperCase()} on ${data.decision.at.toISOString()}${data.decision.clientNameEntered ? ` by ${data.decision.clientNameEntered}` : ""}`
        );
    }

    doc.moveDown(2);
    doc
      .fontSize(8)
      .fillColor("#64748b")
      .text(
        "Electronic acceptance creates a documented record of this change proposal. Legal enforceability may vary by jurisdiction. This is not legal advice."
      );

    doc.end();
  });
}
