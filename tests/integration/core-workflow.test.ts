import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { hashPassword } from "@/lib/auth/password";
import {
  User,
  Workspace,
  WorkspaceMembership,
  Client,
  Project,
  ScopeVersion,
} from "@/models";
import { createProject, createScopeVersion, createClient } from "@/lib/services/project-service";
import { createClientRequest } from "@/lib/services/request-service";
import { createManualAnalysis } from "@/lib/services/analysis-service";
import {
  createProposalDraft,
  sendProposal,
  decideProposal,
} from "@/lib/services/proposal-service";
import { createInvoiceFromProposal, recordPayment } from "@/lib/services/invoice-service";
import { clearTestDb, connectTestDb, disconnectTestDb } from "../setup";

const hasMongo = Boolean(process.env.MONGODB_URI);

async function seedOwner() {
  const user = await User.create({
    email: `freelancer-${Date.now()}@example.test`,
    name: "Alex Freelancer",
    passwordHash: await hashPassword("Password1"),
    emailVerifiedAt: new Date(),
    onboardingCompletedAt: new Date(),
  });
  const workspace = await Workspace.create({
    name: "Alex Studio",
    slug: `alex-studio-${Date.now()}`,
    type: "freelancer",
    ownerId: user._id,
    currency: "INR",
    planId: "free",
  });
  await WorkspaceMembership.create({
    workspaceId: workspace._id,
    userId: user._id,
    role: "owner",
    status: "active",
    joinedAt: new Date(),
    permissions: {
      canPrepareProposals: true,
      canSendProposals: true,
      canManageBilling: true,
      canManageTeam: true,
      canManageIntegrations: true,
    },
  });
  return { user, workspace };
}

describe.skipIf(!hasMongo)("core scope change workflow", () => {
  beforeAll(async () => {
    process.env.SESSION_SECRET =
      process.env.SESSION_SECRET ?? "test-session-secret-at-least-32-characters-long";
    process.env.APP_URL = process.env.APP_URL ?? "http://localhost:3000";
    process.env.AI_PROVIDER = "none";
    await connectTestDb();
  }, 60_000);

  afterEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it("runs project → scope → request → proposal → approval → invoice → payment", async () => {
    const { user, workspace } = await seedOwner();
    const wid = String(workspace._id);
    const uid = String(user._id);

    const client = await createClient({
      workspaceId: wid,
      name: "Acme Corp",
      email: "client@acme.test",
    });

    const project = await createProject({
      workspaceId: wid,
      userId: uid,
      clientId: String(client._id),
      name: "Marketing Website",
      pricingModel: "fixed",
      originalPriceMinor: 15000000,
      currency: "INR",
    });

    const scope = await createScopeVersion({
      workspaceId: wid,
      projectId: String(project._id),
      userId: uid,
      objectives: "Build a 5-page marketing website",
      deliverables: ["Home", "About", "Contact"],
      features: ["Contact form", "CMS for blog"],
      exclusions: ["Custom CRM integrations", "Mobile native apps"],
      includedRevisions: 2,
      additionalWorkPolicy: "Extra work requires written approval",
    });

    expect(scope.versionNumber).toBe(1);
    expect(await ScopeVersion.countDocuments({ projectId: project._id })).toBe(1);

    const request = await createClientRequest({
      workspaceId: wid,
      userId: uid,
      projectId: String(project._id),
      title: "Add Google login",
      originalMessage: "Can we also add Google login to the site?",
      sourceChannel: "whatsapp",
    });

    const analysis = await createManualAnalysis({
      workspaceId: wid,
      requestId: String(request._id),
      userId: uid,
      classification: "potential_scope_change",
      explanation: "Auth integrations are not listed in deliverables or features.",
      effortLowHours: 4,
      effortHighHours: 8,
    });
    expect(analysis.classification).toBe("potential_scope_change");

    const proposal = await createProposalDraft({
      workspaceId: wid,
      requestId: String(request._id),
      userId: uid,
      title: "Google login add-on",
      additionalWorkDescription: "Implement OAuth Google sign-in",
      whySeparate: "Authentication was not included in the original scope",
      lineItems: [
        { description: "OAuth implementation", quantity: 6, unit: "hours", rateMinor: 250000 },
      ],
      taxRateBps: 1800,
      additionalWorkingDays: 3,
      paymentTerms: "Due on approval",
    });

    expect(proposal.subtotalMinor).toBe(1500000);
    expect(proposal.taxMinor).toBe(270000);
    expect(proposal.totalMinor).toBe(1770000);

    const { approveUrl, rawToken } = await sendProposal({
      proposalId: String(proposal._id),
      workspaceId: wid,
      userId: uid,
    });
    expect(approveUrl).toContain("/approve/");
    expect(rawToken.length).toBeGreaterThan(20);

    const decision = await decideProposal({
      rawToken,
      decision: "approved",
      confirmationAccepted: true,
      clientNameEntered: "Jamie Client",
      idempotencyKey: "test-approve-1",
    });
    expect(decision.proposal.status).toBe("approved");
    expect(decision.duplicate).toBe(false);

    const duplicate = await decideProposal({
      rawToken,
      decision: "approved",
      confirmationAccepted: true,
      idempotencyKey: "test-approve-1",
    });
    expect(duplicate.duplicate).toBe(true);

    await expect(
      decideProposal({
        rawToken,
        decision: "approved",
        confirmationAccepted: true,
        idempotencyKey: "test-approve-2",
      })
    ).rejects.toThrow(/cannot be decided|already decided/i);

    const invoice = await createInvoiceFromProposal({
      workspaceId: wid,
      proposalId: String(proposal._id),
      userId: uid,
    });
    expect(invoice.outstandingMinor).toBe(1770000);

    const { invoice: paid } = await recordPayment({
      workspaceId: wid,
      invoiceId: String(invoice._id),
      userId: uid,
      amountMinor: 1770000,
      paidAt: new Date(),
      reference: "UPI-123",
    });
    expect(paid.status).toBe("paid");
    expect(paid.outstandingMinor).toBe(0);

    const other = await Workspace.create({
      name: "Other",
      slug: `other-ws-${Date.now()}`,
      type: "freelancer",
      ownerId: user._id,
      currency: "INR",
    });
    const leaked = await Project.findOne({
      _id: project._id,
      workspaceId: other._id,
    });
    expect(leaked).toBeNull();

    const clientDoc = await Client.findById(client._id);
    expect(clientDoc?.name).toBe("Acme Corp");
  });

  it("rejects approval without confirmation", async () => {
    const { user, workspace } = await seedOwner();
    const wid = String(workspace._id);
    const uid = String(user._id);
    const client = await createClient({ workspaceId: wid, name: "C" });
    const project = await createProject({
      workspaceId: wid,
      userId: uid,
      clientId: String(client._id),
      name: "P",
    });
    await createScopeVersion({
      workspaceId: wid,
      projectId: String(project._id),
      userId: uid,
      objectives: "O",
      exclusions: ["X"],
    });
    const request = await createClientRequest({
      workspaceId: wid,
      userId: uid,
      projectId: String(project._id),
      title: "Extra page",
    });
    const proposal = await createProposalDraft({
      workspaceId: wid,
      requestId: String(request._id),
      userId: uid,
      title: "Extra page",
      lineItems: [{ description: "Page", quantity: 1, unit: "fixed", rateMinor: 500000 }],
    });
    const { rawToken } = await sendProposal({
      proposalId: String(proposal._id),
      workspaceId: wid,
      userId: uid,
    });
    await expect(
      decideProposal({
        rawToken,
        decision: "approved",
        confirmationAccepted: false,
      })
    ).rejects.toThrow(/confirm/i);
  });
});
