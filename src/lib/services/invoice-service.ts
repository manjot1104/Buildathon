import { connectDb } from "@/lib/db/connection";
import { AppError } from "@/lib/errors";
import { assertSameCurrency } from "@/lib/money";
import { recordAudit } from "@/lib/services/audit";
import { ChangeProposal, Invoice, PaymentRecord } from "@/models";

function recomputeInvoiceStatus(invoice: {
  totalMinor: number;
  amountPaidMinor: number;
  outstandingMinor: number;
  status: string;
  dueDate: Date | null;
  voidedAt: Date | null;
}) {
  if (invoice.voidedAt || invoice.status === "void") return "void";
  if (invoice.status === "draft") return "draft";
  if (invoice.outstandingMinor <= 0) return "paid";
  if (invoice.amountPaidMinor > 0 && invoice.outstandingMinor > 0) return "partially_paid";
  if (invoice.dueDate && invoice.dueDate.getTime() < Date.now() && invoice.outstandingMinor > 0) {
    return "overdue";
  }
  return "issued";
}

export async function createInvoiceFromProposal(input: {
  workspaceId: string;
  proposalId: string;
  userId: string;
  dueDate?: Date | null;
  notes?: string;
}) {
  await connectDb();
  const proposal = await ChangeProposal.findOne({
    _id: input.proposalId,
    workspaceId: input.workspaceId,
    status: "approved",
  });
  if (!proposal) throw new AppError("NOT_FOUND", "Approved proposal not found");

  const count = await Invoice.countDocuments({ workspaceId: input.workspaceId });
  const invoiceNumber = `INV-${String(count + 1).padStart(4, "0")}`;

  const invoice = await Invoice.create({
    workspaceId: input.workspaceId,
    projectId: proposal.projectId,
    clientId: proposal.clientId,
    proposalId: proposal._id,
    invoiceNumber,
    status: "issued",
    issueDate: new Date(),
    dueDate: input.dueDate ?? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    currency: proposal.currency,
    subtotalMinor: proposal.subtotalMinor,
    taxMinor: proposal.taxMinor,
    totalMinor: proposal.totalMinor,
    amountPaidMinor: 0,
    outstandingMinor: proposal.totalMinor,
    notes: input.notes ?? "",
    createdById: input.userId,
  });

  await recordAudit({
    workspaceId: input.workspaceId,
    actorUserId: input.userId,
    actorType: "user",
    eventType: "invoice.issued",
    entityType: "invoice",
    entityId: invoice._id,
    summary: `Invoice ${invoiceNumber} issued`,
  });

  return invoice;
}

export async function recordPayment(input: {
  workspaceId: string;
  invoiceId: string;
  userId: string;
  amountMinor: number;
  paidAt: Date;
  reference?: string;
  method?: string;
  notes?: string;
}) {
  if (!Number.isInteger(input.amountMinor) || input.amountMinor <= 0) {
    throw new AppError("VALIDATION_ERROR", "Payment amount must be a positive integer in minor units");
  }

  await connectDb();
  const invoice = await Invoice.findOne({
    _id: input.invoiceId,
    workspaceId: input.workspaceId,
  });
  if (!invoice) throw new AppError("NOT_FOUND", "Invoice not found");
  if (invoice.status === "void" || invoice.status === "draft") {
    throw new AppError("CONFLICT", `Cannot record payment on a ${invoice.status} invoice`);
  }
  if (input.amountMinor > invoice.outstandingMinor) {
    throw new AppError("VALIDATION_ERROR", "Payment exceeds outstanding balance");
  }

  assertSameCurrency(invoice.currency, invoice.currency);

  const payment = await PaymentRecord.create({
    workspaceId: input.workspaceId,
    invoiceId: invoice._id,
    amountMinor: input.amountMinor,
    currency: invoice.currency,
    paidAt: input.paidAt,
    reference: input.reference ?? "",
    method: input.method ?? "manual",
    notes: input.notes ?? "",
    recordedById: input.userId,
  });

  invoice.amountPaidMinor += input.amountMinor;
  invoice.outstandingMinor = invoice.totalMinor - invoice.amountPaidMinor;
  invoice.status = recomputeInvoiceStatus({
    totalMinor: invoice.totalMinor,
    amountPaidMinor: invoice.amountPaidMinor,
    outstandingMinor: invoice.outstandingMinor,
    status: invoice.status,
    dueDate: invoice.dueDate ?? null,
    voidedAt: invoice.voidedAt ?? null,
  }) as never;
  await invoice.save();

  await recordAudit({
    workspaceId: input.workspaceId,
    actorUserId: input.userId,
    actorType: "user",
    eventType: "payment.recorded",
    entityType: "payment",
    entityId: payment._id,
    summary: `Payment recorded on ${invoice.invoiceNumber}`,
    newValues: { amountMinor: input.amountMinor, outstandingMinor: invoice.outstandingMinor },
  });

  return { invoice, payment };
}
