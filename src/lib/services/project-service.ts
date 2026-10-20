import { connectDb } from "@/lib/db/connection";
import { AppError } from "@/lib/errors";
import { assertCanCreateProject } from "@/lib/services/entitlements";
import { recordAudit } from "@/lib/services/audit";
import { Client, Project, ScopeVersion, Workspace } from "@/models";

export async function createProject(input: {
  workspaceId: string;
  userId: string;
  clientId: string;
  name: string;
  description?: string;
  status?: "draft" | "active" | "on_hold" | "completed" | "archived";
  startDate?: Date | null;
  deadline?: Date | null;
  currency?: string;
  originalPriceMinor?: number;
  pricingModel?: "fixed" | "hourly" | "milestone";
  defaultHourlyRateMinor?: number;
  estimatedOriginalHours?: number | null;
  includedRevisions?: number;
  revisionPolicy?: string;
  communicationMethod?: string;
  exclusionsSummary?: string;
  internalNotes?: string;
}) {
  await connectDb();
  const workspace = await Workspace.findById(input.workspaceId);
  if (!workspace) throw new AppError("NOT_FOUND", "Workspace not found");

  const client = await Client.findOne({
    _id: input.clientId,
    workspaceId: input.workspaceId,
    archivedAt: null,
  });
  if (!client) throw new AppError("NOT_FOUND", "Client not found");

  const activeCount = await Project.countDocuments({
    workspaceId: input.workspaceId,
    status: { $in: ["draft", "active", "on_hold"] },
    archivedAt: null,
  });
  assertCanCreateProject(workspace, activeCount);

  const project = await Project.create({
    workspaceId: input.workspaceId,
    clientId: input.clientId,
    name: input.name.trim(),
    description: input.description ?? "",
    status: input.status ?? "active",
    startDate: input.startDate ?? null,
    deadline: input.deadline ?? null,
    currency: (input.currency ?? workspace.currency).toUpperCase(),
    originalPriceMinor: input.originalPriceMinor ?? 0,
    pricingModel: input.pricingModel ?? workspace.defaultPricingModel,
    defaultHourlyRateMinor:
      input.defaultHourlyRateMinor ?? workspace.defaultHourlyRateMinor ?? 0,
    estimatedOriginalHours: input.estimatedOriginalHours ?? null,
    includedRevisions: input.includedRevisions ?? 0,
    revisionPolicy: input.revisionPolicy ?? "",
    communicationMethod: input.communicationMethod ?? "",
    exclusionsSummary: input.exclusionsSummary ?? "",
    internalNotes: input.internalNotes ?? "",
    createdById: input.userId,
  });

  await recordAudit({
    workspaceId: input.workspaceId,
    actorUserId: input.userId,
    actorType: "user",
    eventType: "project.created",
    entityType: "project",
    entityId: project._id,
    summary: `Project "${project.name}" created`,
  });

  return project;
}

export async function createScopeVersion(input: {
  workspaceId: string;
  projectId: string;
  userId: string;
  label?: string;
  objectives?: string;
  deliverables?: string[];
  features?: string[];
  includedFunctionality?: string[];
  exclusions?: string[];
  includedRevisions?: number;
  milestones?: Array<{
    name?: string;
    dueDate?: Date;
    amountMinor?: number;
    description?: string;
  }>;
  deliveryDates?: string;
  agreedBudgetMinor?: number;
  paymentTerms?: string;
  additionalWorkPolicy?: string;
  rawPastedText?: string;
  extractionNotes?: string;
}) {
  await connectDb();
  const project = await Project.findOne({
    _id: input.projectId,
    workspaceId: input.workspaceId,
  });
  if (!project) throw new AppError("NOT_FOUND", "Project not found");

  const latest = await ScopeVersion.findOne({ projectId: project._id })
    .sort({ versionNumber: -1 })
    .select("versionNumber");
  const versionNumber = (latest?.versionNumber ?? 0) + 1;

  await ScopeVersion.updateMany(
    { projectId: project._id, isCurrent: true },
    { $set: { isCurrent: false } }
  );

  const scope = await ScopeVersion.create({
    workspaceId: input.workspaceId,
    projectId: project._id,
    versionNumber,
    label: input.label ?? `Version ${versionNumber}`,
    objectives: input.objectives ?? "",
    deliverables: input.deliverables ?? [],
    features: input.features ?? [],
    includedFunctionality: input.includedFunctionality ?? [],
    exclusions: input.exclusions ?? [],
    includedRevisions: input.includedRevisions ?? project.includedRevisions ?? 0,
    milestones: input.milestones ?? [],
    deliveryDates: input.deliveryDates ?? "",
    agreedBudgetMinor: input.agreedBudgetMinor ?? project.originalPriceMinor ?? 0,
    paymentTerms: input.paymentTerms ?? "",
    additionalWorkPolicy:
      input.additionalWorkPolicy ??
      "Additional work outside this scope requires a written change proposal and client approval before work begins.",
    rawPastedText: input.rawPastedText ?? "",
    extractionNotes: input.extractionNotes ?? "",
    createdById: input.userId,
    isCurrent: true,
  });

  project.currentScopeVersionId = scope._id;
  if (input.includedRevisions !== undefined) {
    project.includedRevisions = input.includedRevisions;
  }
  await project.save();

  await recordAudit({
    workspaceId: input.workspaceId,
    actorUserId: input.userId,
    actorType: "user",
    eventType: "scope.version_created",
    entityType: "scope_version",
    entityId: scope._id,
    summary: `Scope version ${versionNumber} saved for "${project.name}"`,
  });

  return scope;
}

export async function createClient(input: {
  workspaceId: string;
  name: string;
  email?: string | null;
  company?: string | null;
  phone?: string | null;
  notes?: string | null;
  preferredChannel?: "whatsapp" | "email" | "meeting" | "phone" | "other";
}) {
  await connectDb();
  return Client.create({
    workspaceId: input.workspaceId,
    name: input.name.trim(),
    email: input.email?.toLowerCase().trim() || null,
    company: input.company ?? null,
    phone: input.phone ?? null,
    notes: input.notes ?? null,
    preferredChannel: input.preferredChannel ?? "email",
  });
}
