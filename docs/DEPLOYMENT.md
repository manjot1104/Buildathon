# Deployment

## Prerequisites

- MongoDB Atlas cluster (or self-hosted MongoDB)
- Node.js 18.18+
- Environment variables from `.env.example`

## Vercel (recommended for MVP)

1. Import the repository into Vercel.
2. Framework preset: Next.js.
3. Set env vars (`MONGODB_URI`, `SESSION_SECRET`, `APP_URL`, etc.).
4. Deploy.
5. Point `APP_URL` at the production domain.
6. Configure Atlas network access for Vercel egress (or allow `0.0.0.0/0` carefully).

Uploads: set `STORAGE_PROVIDER=s3` and S3 credentials for production. Local disk is not durable on serverless.

Background jobs: the MVP drains the Mongo-backed queue when jobs are enqueued. For higher volume, add a cron hitting an authenticated internal drain endpoint or a Render worker.

## Render / Node host

```bash
npm ci
npm run build
npm start
```

Set the same environment variables. Attach persistent disk or object storage for uploads.

## Database

```bash
npm run db:migrate
# optional non-production sample data:
npm run db:seed
```

## Backups

Use Atlas continuous backups or scheduled `mongodump`. Retain financial and approval records per your legal requirements before any destructive purge.

## Security checklist

- Unique strong `SESSION_SECRET`
- HTTPS only cookies in production (`NODE_ENV=production`)
- SMTP configured for verification / resets
- Admin bootstrap via `ADMIN_EMAIL` only for the first trusted account
- Review webhook secrets before enabling WhatsApp / Stripe
