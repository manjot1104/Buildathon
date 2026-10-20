import { z } from "zod";
import { jsonCreated, jsonOk, jsonError } from "@/lib/api/response";
import { requireAuthWorkspace } from "@/lib/api/workspace";
import { createInvoiceFromProposal, recordPayment } from "@/lib/services/invoice-service";
import { connectDb } from "@/lib/db/connection";
import { Invoice } from "@/models";
import { toMinor } from "@/lib/money";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { workspace } = await requireAuthWorkspace();
    await connectDb();
    const items = await Invoice.find({ workspaceId: workspace.workspaceId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return jsonOk({
      items: items.map((i) => ({
        id: String(i._id),
        invoiceNumber: i.invoiceNumber,
        status: i.status,
        totalMinor: i.totalMinor,
        amountPaidMinor: i.amountPaidMinor,
        outstandingMinor: i.outstandingMinor,
        currency: i.currency,
        dueDate: i.dueDate,
        proposalId: i.proposalId ? String(i.proposalId) : null,
        projectId: String(i.projectId),
      })),
    });
  } catch (err) {
    return jsonError(err);
  }
}

const createSchema = z.object({
  proposalId: z.string().min(1),
  dueDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const { session, workspace } = await requireAuthWorkspace();
    const body = createSchema.parse(await req.json());
    const invoice = await createInvoiceFromProposal({
      workspaceId: workspace.workspaceId,
      proposalId: body.proposalId,
      userId: session.user.id,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      notes: body.notes,
    });
    return jsonCreated({
      id: String(invoice._id),
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      totalMinor: invoice.totalMinor,
      outstandingMinor: invoice.outstandingMinor,
    });
  } catch (err) {
    return jsonError(err);
  }
}

const paySchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.number().positive(),
  paidAt: z.string().datetime().optional(),
  reference: z.string().optional(),
  method: z.string().optional(),
  notes: z.string().optional(),
});

export async function PUT(req: Request) {
  try {
    const { session, workspace } = await requireAuthWorkspace();
    const body = paySchema.parse(await req.json());
    const result = await recordPayment({
      workspaceId: workspace.workspaceId,
      invoiceId: body.invoiceId,
      userId: session.user.id,
      amountMinor: toMinor(body.amount),
      paidAt: body.paidAt ? new Date(body.paidAt) : new Date(),
      reference: body.reference,
      method: body.method,
      notes: body.notes,
    });
    return jsonOk({
      invoice: {
        id: String(result.invoice._id),
        status: result.invoice.status,
        amountPaidMinor: result.invoice.amountPaidMinor,
        outstandingMinor: result.invoice.outstandingMinor,
      },
      payment: {
        id: String(result.payment._id),
        amountMinor: result.payment.amountMinor,
      },
    });
  } catch (err) {
    return jsonError(err);
  }
}

export async function PATCH(req: Request) {
  // Alias for payment recording convenience
  return PUT(req);
}
