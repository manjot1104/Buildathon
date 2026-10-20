# ScopePilot Architecture

## Overview

ScopePilot is a multi-tenant SaaS for freelancers and small agencies to capture client requests, detect scope creep, price extra work, and obtain documented client approval.

**Stack:** Next.js 14 (App Router) + TypeScript + MongoDB/Mongoose + Zod + Tailwind/shadcn-style UI.

A single Next.js application hosts both the UI and versioned REST API (`/api/v1/*`). This keeps early-stage ops affordable while remaining deployable to Vercel (or any Node host). Background work uses a MongoDB-backed job queue so no Redis is required for MVP.

## Layering

```
src/app              → Pages (marketing, app, client, admin) + API route handlers
src/components       → UI primitives and feature components
src/lib
  config             → Env validation
  db                 → Mongo connection
  auth               → Sessions, passwords, CSRF
  money              → Integer minor-unit arithmetic
  security           → Tokens, hashing, rate limits
  services           → Domain business logic
  providers          → AI, email, WhatsApp, storage adapters
  jobs               → Background job processor
  pdf                → Proposal/invoice PDF generation
src/models           → Mongoose schemas
src/types            → Shared TypeScript types
```

## Multi-tenancy

Every tenant-owned document includes `workspaceId`. Authorization always:

1. Authenticates the session (or client access token).
2. Resolves membership and role.
3. Scopes queries by `workspaceId` from membership — never from untrusted client input alone.

## Client access tokens

Public approval URLs use high-entropy random tokens. Only SHA-256 hashes are stored. Tokens expire and can be revoked. MongoDB ObjectIds are never used as secrets.

## Money

All currency amounts are stored as integers in the currency’s minor units (e.g. paise, cents). Totals are computed server-side. Floating-point is never used for financial math.

## Proposal immutability

Draft proposals are editable. On send, a frozen `ProposalVersion` snapshot is created. Client decisions bind to a specific version. Material edits after send create a new revision.

## AI

AI providers are behind an interface. Analysis is advisory; humans confirm pricing and sending. Without credentials, the UI shows an unavailable state and supports full manual workflow.

## Feature entitlements

Plan limits are enforced via an entitlement service, not scattered plan-name checks.
