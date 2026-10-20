# ScopePilot

**Know what's included. Document what's extra. Get approval before doing additional work.**

ScopePilot helps freelancers and small agencies capture client requests, compare them to the agreed scope, price extra work, and obtain documented client approval — without replacing a full project-management tool.

## Stack

- Next.js 14 (App Router) + TypeScript
- MongoDB + Mongoose
- Zod validation, secure cookie sessions (bcrypt + hashed session tokens)
- Tailwind CSS + accessible UI primitives
- Vitest (+ MongoMemoryServer) for unit/integration tests
- Playwright-ready for e2e (`npm run test:e2e` after installing browsers)

## Quick start

1. Copy environment variables:

```bash
cp .env.example .env.local
```

2. Set `MONGODB_URI` to a MongoDB Atlas cluster or local MongoDB instance.

3. Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

4. Optional sample data (never on production):

```bash
npm run db:seed
```

Demo login after seed: `demo@scopepilot.local` / `ScopePilot1!`

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm test` | Unit + integration tests |
| `npm run test:e2e` | Playwright e2e |
| `npm run db:seed` | Seed sample data |
| `npm run db:migrate` | Apply DB migrations |

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

Domain flow:

1. Create workspace → project → original scope version  
2. Record client request  
3. Manual or AI (optional) scope analysis  
4. Build & send change proposal (immutable snapshot + hashed client token)  
5. Client approves / rejects / asks clarification on `/approve/[token]`  
6. Track completion, invoice, and manual payments  

## Environment

See `.env.example`. Required for local run:

- `MONGODB_URI`
- `SESSION_SECRET` (≥ 32 characters)
- `APP_URL`

Optional integrations (honest “not connected” until configured):

- SMTP email
- OpenAI (`OPENAI_API_KEY`)
- WhatsApp Cloud API
- Stripe billing

## API

Versioned REST under `/api/v1`. OpenAPI sketch: [docs/openapi.yaml](docs/openapi.yaml).

Health: `GET /api/v1/health`

## Security notes

- Passwords hashed with bcrypt (12 rounds)
- Sessions stored as SHA-256 hashes in HttpOnly cookies
- Client approval tokens are high-entropy; only hashes stored
- Workspace authorization on every protected API
- Money stored as integer minor units
- Sent proposals freeze commercial terms in `sentSnapshot`
- AI output is advisory; never auto-sent
- No secrets in client bundles

## Deployment

### Frontend + API (Vercel)

1. Create a Vercel project from this repo.
2. Set environment variables from `.env.example`.
3. Use MongoDB Atlas for `MONGODB_URI`.
4. Deploy. Background jobs drain on enqueue (for heavier load, run a separate worker calling `drainJobs`).

### Alternative Node host (Render)

1. Build: `npm run build`
2. Start: `npm start`
3. Set the same env vars.
4. Attach a persistent disk or S3 for uploads if using local storage is insufficient.

### Production checklist

- [ ] Rotate `SESSION_SECRET` / `CSRF_SECRET`
- [ ] Restrict CORS / `APP_URL` to your domain
- [ ] Enable SMTP and verify email flows
- [ ] Configure Atlas network access + backups
- [ ] Use S3-compatible storage for attachments
- [ ] Review rate limits for multi-instance (consider Redis)
- [ ] Do not claim SOC 2 / legal compliance without an audit

## Known limitations (MVP)

- File OCR for scanned PDFs reports when OCR is required; full OCR path needs an OCR provider.
- Subscription billing shows plan entitlements; Stripe checkout requires credentials.
- WhatsApp reads/writes only via official Cloud API when configured — no personal WhatsApp scraping.
- In-memory rate limiting is per-instance.
- Background jobs are Mongo-backed and kicked in-process (fine for early SaaS; add a dedicated worker for scale).

## License

Proprietary — all rights reserved for the ScopePilot product.
