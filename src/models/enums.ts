export const WORKSPACE_TYPES = ["freelancer", "agency"] as const;
export type WorkspaceType = (typeof WORKSPACE_TYPES)[number];

export const MEMBERSHIP_ROLES = ["owner", "admin", "member"] as const;
export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

export const MEMBERSHIP_STATUS = ["active", "invited", "revoked"] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUS)[number];

export const PROJECT_STATUSES = ["draft", "active", "on_hold", "completed", "archived"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PRICING_MODELS = ["fixed", "hourly", "milestone"] as const;
export type PricingModel = (typeof PRICING_MODELS)[number];

export const REQUEST_SOURCES = ["whatsapp", "email", "meeting", "phone", "other"] as const;
export type RequestSource = (typeof REQUEST_SOURCES)[number];

export const REQUEST_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type RequestPriority = (typeof REQUEST_PRIORITIES)[number];

export const REQUEST_STATUSES = [
  "new",
  "needs_review",
  "clarification_required",
  "scope_analysis_complete",
  "proposal_draft",
  "sent_to_client",
  "approved",
  "rejected",
  "withdrawn",
  "completed",
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const ANALYSIS_CLASSIFICATIONS = [
  "likely_included",
  "potential_scope_change",
  "unclear",
] as const;
export type AnalysisClassification = (typeof ANALYSIS_CLASSIFICATIONS)[number];

export const PROPOSAL_STATUSES = [
  "draft",
  "sent",
  "viewed",
  "clarification_requested",
  "approved",
  "rejected",
  "expired",
  "withdrawn",
] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export const DECISION_TYPES = ["approved", "rejected", "clarification_requested"] as const;
export type DecisionType = (typeof DECISION_TYPES)[number];

export const INVOICE_STATUSES = [
  "draft",
  "issued",
  "partially_paid",
  "paid",
  "overdue",
  "void",
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const PLAN_IDS = ["free", "pro", "agency"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export const SUBSCRIPTION_STATUSES = [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "incomplete",
  "unconfigured",
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const JOB_STATUSES = ["pending", "processing", "completed", "failed", "dead"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const USER_ROLES = ["user", "platform_admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];
