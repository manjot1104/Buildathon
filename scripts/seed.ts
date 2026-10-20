/**
 * Seed clearly fictional sample data for local development.
 * Never run against production with known passwords.
 *
 * Usage: MONGODB_URI=... npm run db:seed
 */
import mongoose from "mongoose";
import { hashPassword } from "../src/lib/auth/password";
import {
  User,
  Workspace,
  WorkspaceMembership,
  Client,
  Project,
  ScopeVersion,
  ClientRequest,
  ChangeProposal,
  Invoice,
} from "../src/models";
import { hashToken, generateSecureToken } from "../src/lib/security/tokens";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is required");
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed production");
  }

  await mongoose.connect(uri);
  console.log("Connected. Clearing development collections…");

  await Promise.all([
    User.deleteMany({}),
    Workspace.deleteMany({}),
    WorkspaceMembership.deleteMany({}),
    Client.deleteMany({}),
    Project.deleteMany({}),
    ScopeVersion.deleteMany({}),
    ClientRequest.deleteMany({}),
    ChangeProposal.deleteMany({}),
    Invoice.deleteMany({}),
  ]);

  const passwordHash = await hashPassword("ScopePilot1!");

  const user = await User.create({
    email: "demo@scopepilot.local",
    name: "Demo Freelancer",
    passwordHash,
    emailVerifiedAt: new Date(),
    onboardingCompletedAt: new Date(),
    onboardingStep: 8,
    timezone: "Asia/Kolkata",
  });

  const workspace = await Workspace.create({
    name: "Demo Studio",
    slug: "demo-studio",
    type: "freelancer",
    ownerId: user._id,
    currency: "INR",
    timezone: "Asia/Kolkata",
    defaultPricingModel: "hourly",
    defaultHourlyRateMinor: 250000,
    planId: "free",
    subscriptionStatus: "unconfigured",
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

  const client = await Client.create({
    workspaceId: workspace._id,
    name: "Northwind Traders (Sample)",
    email: "client@northwind.sample",
    company: "Northwind Traders",
    preferredChannel: "email",
  });

  const project = await Project.create({
    workspaceId: workspace._id,
    clientId: client._id,
    name: "Company Website Redesign (Sample)",
    description: "Sample project for exploring ScopePilot.",
    status: "active",
    currency: "INR",
    originalPriceMinor: 20000000,
    pricingModel: "fixed",
    defaultHourlyRateMinor: 250000,
    includedRevisions: 2,
    createdById: user._id,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  const scope = await ScopeVersion.create({
    workspaceId: workspace._id,
    projectId: project._id,
    versionNumber: 1,
    label: "Original agreement",
    objectives: "Redesign the public marketing website.",
    deliverables: ["Home", "About", "Services", "Contact"],
    features: ["Responsive layout", "Contact form", "Basic SEO"],
    exclusions: ["Custom CRM", "Mobile apps", "Ongoing content writing"],
    includedRevisions: 2,
    paymentTerms: "50% upfront, 50% on delivery",
    additionalWorkPolicy:
      "Work outside this scope requires a written change proposal and approval.",
    agreedBudgetMinor: 20000000,
    createdById: user._id,
    isCurrent: true,
  });

  project.currentScopeVersionId = scope._id;
  await project.save();

  const request = await ClientRequest.create({
    workspaceId: workspace._id,
    projectId: project._id,
    clientId: client._id,
    title: "Add member login portal",
    originalMessage: "Hi — can we also add a members-only login area?",
    description: "Client wants authenticated member pages.",
    sourceChannel: "email",
    status: "proposal_draft",
    statusHistory: [{ from: null, to: "new", at: new Date(), byUserId: user._id }],
    createdById: user._id,
    ownerId: user._id,
  });

  const draft = await ChangeProposal.create({
    workspaceId: workspace._id,
    projectId: project._id,
    requestId: request._id,
    clientId: client._id,
    proposalNumber: "CR-0001",
    status: "draft",
    title: "Member login portal (draft sample)",
    lineItems: [
      {
        description: "Auth + member pages",
        quantity: 12,
        unit: "hours",
        rateMinor: 250000,
        amountMinor: 3000000,
      },
    ],
    subtotalMinor: 3000000,
    taxMinor: 540000,
    totalMinor: 3540000,
    currency: "INR",
    scopeVersionId: scope._id,
    createdById: user._id,
    additionalWorkDescription: "Build email/password member authentication and 2 protected pages.",
  });

  const pendingToken = generateSecureToken();
  await ChangeProposal.create({
    workspaceId: workspace._id,
    projectId: project._id,
    requestId: request._id,
    clientId: client._id,
    proposalNumber: "CR-0002",
    status: "sent",
    title: "Blog CMS add-on (pending sample)",
    lineItems: [
      {
        description: "CMS setup",
        quantity: 1,
        unit: "fixed",
        rateMinor: 5000000,
        amountMinor: 5000000,
      },
    ],
    subtotalMinor: 5000000,
    taxMinor: 900000,
    totalMinor: 5900000,
    currency: "INR",
    scopeVersionId: scope._id,
    createdById: user._id,
    sentAt: new Date(),
    accessTokenHash: hashToken(pendingToken),
    accessTokenExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    sentSnapshot: {
      projectName: project.name,
      workspaceName: workspace.name,
      clientName: client.name,
      requestSummary: "Add blog CMS",
      additionalWorkDescription: "Install and configure a blog CMS.",
      whySeparate: "Content CMS was excluded from original scope.",
      deliverables: ["Blog index", "Post template"],
      exclusions: ["Content writing"],
      assumptions: [],
      lineItems: [
        {
          description: "CMS setup",
          quantity: 1,
          unit: "fixed",
          rateMinor: 5000000,
          amountMinor: 5000000,
        },
      ],
      subtotalMinor: 5000000,
      discountMinor: 0,
      feesMinor: 0,
      taxMinor: 900000,
      totalMinor: 5900000,
      currency: "INR",
      additionalWorkingDays: 5,
      originalDeadline: project.deadline,
      proposedDeadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
      paymentTerms: "Due on approval",
      scopeVersionId: scope._id,
      scopeExcerpt: "Exclusions: Custom CRM, Mobile apps, Ongoing content writing",
    },
  });

  const approved = await ChangeProposal.create({
    workspaceId: workspace._id,
    projectId: project._id,
    requestId: request._id,
    clientId: client._id,
    proposalNumber: "CR-0003",
    status: "approved",
    title: "Extra landing page (approved sample)",
    lineItems: [
      {
        description: "Landing page",
        quantity: 1,
        unit: "fixed",
        rateMinor: 2500000,
        amountMinor: 2500000,
      },
    ],
    subtotalMinor: 2500000,
    taxMinor: 450000,
    totalMinor: 2950000,
    currency: "INR",
    scopeVersionId: scope._id,
    createdById: user._id,
    sentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    decidedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  });

  await Invoice.create({
    workspaceId: workspace._id,
    projectId: project._id,
    clientId: client._id,
    proposalId: approved._id,
    invoiceNumber: "INV-0001",
    status: "issued",
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    currency: "INR",
    subtotalMinor: 2500000,
    taxMinor: 450000,
    totalMinor: 2950000,
    amountPaidMinor: 0,
    outstandingMinor: 2950000,
    createdById: user._id,
  });

  console.log("\nSeed complete (fictional sample data).");
  console.log("Login: demo@scopepilot.local / ScopePilot1!");
  console.log(`Pending client approval URL: ${process.env.APP_URL ?? "http://localhost:3000"}/approve/${pendingToken}`);
  console.log(`Draft proposal id: ${draft._id}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
