import { Types } from "mongoose";
import { jsonOk, jsonError } from "@/lib/api/response";
import { requireAuthWorkspace } from "@/lib/api/workspace";
import { connectDb } from "@/lib/db/connection";
import {
  AuditEvent,
  ChangeProposal,
  ClientRequest,
  Invoice,
  Project,
} from "@/models";

export async function GET() {
  try {
    const { workspace } = await requireAuthWorkspace();
    await connectDb();
    const wid = new Types.ObjectId(workspace.workspaceId);

    const [
      activeProjects,
      requestsAwaitingReview,
      proposalsAwaitingApproval,
      approvedNotCompleted,
      overdueInvoices,
      recentActivity,
      pendingProposals,
      recentApproved,
      attentionProjects,
      approvedAgg,
      proposedAgg,
      invoiceAgg,
    ] = await Promise.all([
      Project.countDocuments({
        workspaceId: wid,
        status: { $in: ["active", "on_hold"] },
        archivedAt: null,
      }),
      ClientRequest.countDocuments({
        workspaceId: wid,
        status: { $in: ["new", "needs_review", "clarification_required"] },
      }),
      ChangeProposal.countDocuments({
        workspaceId: wid,
        status: { $in: ["sent", "viewed", "clarification_requested"] },
      }),
      ChangeProposal.countDocuments({
        workspaceId: wid,
        status: "approved",
        workCompletedAt: null,
      }),
      Invoice.countDocuments({ workspaceId: wid, status: "overdue" }),
      AuditEvent.find({ workspaceId: wid }).sort({ createdAt: -1 }).limit(15).lean(),
      ChangeProposal.find({
        workspaceId: wid,
        status: { $in: ["sent", "viewed", "clarification_requested"] },
      })
        .sort({ updatedAt: -1 })
        .limit(8)
        .lean(),
      ChangeProposal.find({ workspaceId: wid, status: "approved" })
        .sort({ decidedAt: -1 })
        .limit(8)
        .lean(),
      Project.find({
        workspaceId: wid,
        status: "active",
        archivedAt: null,
      })
        .sort({ updatedAt: -1 })
        .limit(8)
        .lean(),
      ChangeProposal.aggregate([
        { $match: { workspaceId: wid, status: "approved" } },
        {
          $group: {
            _id: null,
            clientApprovedAmountMinor: { $sum: "$totalMinor" },
          },
        },
      ]),
      ChangeProposal.aggregate([
        {
          $match: {
            workspaceId: wid,
            status: { $in: ["sent", "viewed", "clarification_requested", "draft"] },
          },
        },
        { $group: { _id: null, proposedAmountMinor: { $sum: "$totalMinor" } } },
      ]),
      Invoice.aggregate([
        {
          $match: {
            workspaceId: wid,
            status: { $nin: ["void", "draft"] },
          },
        },
        {
          $group: {
            _id: null,
            invoicedAmountMinor: { $sum: "$totalMinor" },
            paidAmountMinor: { $sum: "$amountPaidMinor" },
            outstandingAmountMinor: { $sum: "$outstandingMinor" },
          },
        },
      ]),
    ]);

    return jsonOk({
      cards: {
        activeProjects,
        requestsAwaitingReview,
        proposalsAwaitingClientApproval: proposalsAwaitingApproval,
        approvedExtraWorkNotCompleted: approvedNotCompleted,
        overduePaymentItems: overdueInvoices,
      },
      finances: {
        definitions: {
          proposedAmount: "Sum of draft/sent/viewed proposals (not earned)",
          clientApprovedAmount: "Sum of client-approved proposals (not necessarily paid)",
          invoicedAmount: "Sum of issued invoices",
          paidAmount: "Sum of recorded payments",
          outstandingAmount: "Invoiced minus paid",
        },
        proposedAmountMinor: proposedAgg[0]?.proposedAmountMinor ?? 0,
        clientApprovedAmountMinor: approvedAgg[0]?.clientApprovedAmountMinor ?? 0,
        invoicedAmountMinor: invoiceAgg[0]?.invoicedAmountMinor ?? 0,
        paidAmountMinor: invoiceAgg[0]?.paidAmountMinor ?? 0,
        outstandingAmountMinor: invoiceAgg[0]?.outstandingAmountMinor ?? 0,
      },
      recentActivity: recentActivity.map((a) => ({
        id: String(a._id),
        eventType: a.eventType,
        summary: a.summary,
        createdAt: a.createdAt,
        entityType: a.entityType,
        entityId: a.entityId ? String(a.entityId) : null,
      })),
      pendingClientDecisions: pendingProposals.map((p) => ({
        id: String(p._id),
        proposalNumber: p.proposalNumber,
        title: p.title,
        status: p.status,
        totalMinor: p.totalMinor,
        currency: p.currency,
        projectId: String(p.projectId),
      })),
      recentlyApproved: recentApproved.map((p) => ({
        id: String(p._id),
        proposalNumber: p.proposalNumber,
        title: p.title,
        totalMinor: p.totalMinor,
        currency: p.currency,
        decidedAt: p.decidedAt,
        projectId: String(p.projectId),
        workCompletedAt: p.workCompletedAt,
      })),
      projectsRequiringAttention: attentionProjects.map((p) => ({
        id: String(p._id),
        name: p.name,
        status: p.status,
        deadline: p.deadline,
      })),
    });
  } catch (err) {
    return jsonError(err);
  }
}
