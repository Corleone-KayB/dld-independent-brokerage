# Deployment: Hosting on Vercel

This is a modular monolith with a real Postgres database, session-based auth,
and private file storage — a bare `vercel deploy` covers none of that. Part of
the groundwork was already shipped in the Phase 3 storage-hardening pass
(2026-09-15/16, see `.claude/PROJECT_STATE.md`); the rest is Vercel/infra
configuration that lives outside this repo and needs a few explicit
decisions before the first production deploy.

## Already done in-repo

- Pluggable `StorageProvider` interface (`src/server/storage/`). A
  `vercel-blob` provider (`vercel-blob-provider.ts`, using `@vercel/blob`)
  exists alongside the local-filesystem dev provider, because Vercel's
  filesystem is ephemeral and not shared across instances — without it,
  compliance documents would vanish/404 across serverless invocations.
  `src/lib/env.ts` refuses to boot with `STORAGE_PROVIDER=vercel-blob` and no
  `BLOB_READ_WRITE_TOKEN` set.
- Every document, on either provider, is served only through the signed,
  session-authenticated `/api/compliance/documents/file` route — the raw
  blob URL is never sent to the client. Nothing changes here for Vercel.
- `npm run db:migrate:deploy` (`prisma migrate deploy`) already exists —
  the non-interactive migration command production/CI should use, as
  opposed to `db:migrate` (`prisma migrate dev`, local-only).
- `prisma/schema.prisma` now declares `directUrl = env("DIRECT_URL")` on the
  `db` datasource, and `.env.example` documents both `DATABASE_URL` (pooled)
  and `DIRECT_URL` (unpooled) — Prisma needs a direct connection to run
  migrations reliably against a pooled Postgres. Locally against Docker
  Compose both point at the same connection since there's no pooler.
- A `vercel-build` script (`prisma generate && prisma migrate deploy && next
  build`) now exists in `package.json`, ready to be set as the Vercel
  project's build command once the first manual migration (step 3 below)
  is verified clean.

## Remaining steps (infra/config, not code)

### 1. Database — Vercel Postgres (decided)
Docker Compose is dev-only; Vercel doesn't host Postgres itself. **Decided:
Vercel Postgres** (the native marketplace integration — Neon under the
hood, no separate account to manage, sets connection env vars for you when
you connect the integration to the project).

Connecting the integration adds several auto-generated env vars
(`POSTGRES_URL`, `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, plus
the individual host/user/password/database pieces). This app's schema
expects `DATABASE_URL`/`DIRECT_URL` specifically, so map them in the Vercel
dashboard's env var settings:
- `DATABASE_URL` → value of `POSTGRES_PRISMA_URL` (pooled, already includes
  `pgbouncer=true&connect_timeout=15`)
- `DIRECT_URL` → value of `POSTGRES_URL_NON_POOLING` (unpooled, required by
  Prisma to run migrations)

Serverless functions opening a fresh connection per invocation will exhaust
a direct Postgres connection limit fast — this is exactly why the pooled
URL goes in `DATABASE_URL` and not the direct one used locally against
Docker Compose.

### 2. Object storage — Vercel Blob store
Create a Blob store in the Vercel dashboard, copy the `BLOB_READ_WRITE_TOKEN`
into env vars, set `STORAGE_PROVIDER=vercel-blob`. Fully implemented
already — no code change needed.

### 3. Environment variables (Vercel Production + Preview)
| Var | Production value |
|---|---|
| `DATABASE_URL` | `POSTGRES_PRISMA_URL` from the Vercel Postgres integration, step 1 |
| `DIRECT_URL` | `POSTGRES_URL_NON_POOLING` from the Vercel Postgres integration, step 1 |
| `AUTH_SECRET` | new random secret (e.g. `openssl rand -base64 32`) — never reuse the local `.env` value |
| `NEXTAUTH_URL` | `https://<production-domain>` |
| `NEXT_PUBLIC_APP_URL` | `https://<production-domain>` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | placeholder for now (decided) — swap for the real number before real launch |
| `DLD_OFFICIAL_VERIFICATION_URL` / `..._BROKER_DIRECTORY_URL` / `..._COMPANY_DIRECTORY_URL` | left blank for now (decided) — never fabricate, per CLAUDE.md positioning rules; fill in if/when real official DLD links exist |
| `STORAGE_PROVIDER` | `vercel-blob` |
| `BLOB_READ_WRITE_TOKEN` | from step 2 |
| `SEED_USER_PASSWORD` | keep the default/demo value — this deployment is seeded (decided, step 5) |

### 4. Wiring migrations into the deploy
The `vercel-build` script (`prisma generate && prisma migrate deploy &&
next build`) already exists in `package.json`. For the **first** deploy,
still run `npx prisma migrate deploy` by hand against the production
`DIRECT_URL` first and confirm it's clean — so a bad migration surfaces
clearly instead of silently failing the Vercel build. Once that's verified,
set the Vercel project's Build Command to `npm run vercel-build` so future
schema changes migrate automatically on deploy.

### 5. Seeding — public demo (decided)
This deployment is the public demo, so `npm run db:seed` runs against it
as normal: shared demo accounts, `SEED_USER_PASSWORD` kept at its default,
all data clearly labeled demo per CLAUDE.md's "seed/demo data must visibly
be demo data" rule. (If this ever becomes the real production instance
instead, stop seeding it and create the first `SUPER_ADMIN` manually.)

### 6. Auth/session
No code change — the JWT session strategy is already stateless and
serverless-friendly. Just make sure `AUTH_SECRET`/`NEXTAUTH_URL` are the
real production values (already enforced by `env.ts`'s validation).

### 7. Notifications — logging-only for now (decided)
Keep the current logging-only provider; real outbound email/SMS is
deferred, tracked as a known limitation same as today. No action needed
for this deploy.

### 8. Domain + Preview deployments
Point the custom domain at the Vercel project. Give Preview deployments
their own database branch (Neon/Supabase both support DB branching) or a
shared staging DB — never point Preview at the same `DATABASE_URL` as
Production, since a preview build can run migrations/seed against it.

## Suggested execution order
1. Connect the Vercel Postgres integration + create a Vercel Blob store.
2. Set all env vars from the table above in the Vercel dashboard
   (Production + Preview).
3. Run `prisma migrate deploy` by hand against the production DB once,
   confirm clean.
4. Run `npm run db:seed` against the production DB (public demo, decided).
5. First deploy; smoke-test demo/admin login and a compliance
   document upload → signed download round trip end-to-end.
6. Switch the Vercel Build Command to `npm run vercel-build` for future
   deploys, then attach the custom domain.

## Decisions (locked 2026-09-17)
- **DB provider**: Vercel Postgres.
- **Deployment type**: public demo — seeded, demo data clearly labeled.
- **Notifications**: logging-only provider kept as-is for this deploy.
- **WhatsApp/DLD links**: placeholders kept for now; swap in real values
  (`NEXT_PUBLIC_WHATSAPP_NUMBER`, `DLD_OFFICIAL_*_URL`) before any real
  production launch — this deploy is the demo, not that launch.
