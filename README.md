# DLD Independent Brokerage Partners

A private digital brokerage/real-estate platform for Dubai's independent
brokers and brokerage partners. **This is not an official Dubai Land
Department (DLD) platform** — it is an independent private network that
complements official DLD services and links out to them for official
verification.

Built as a Phase 1 MVP: public marketplace, broker directory, partner
onboarding, embedded CRM, compliance center, admin console, deterministic
property matching, and audit logging.

## Stack

Next.js 15 (App Router, TypeScript, strict mode) · Tailwind CSS · PostgreSQL
· Prisma · Zod · Auth.js (NextAuth v5, credentials + JWT sessions) · Vitest ·
Playwright · ESLint/Prettier · Docker Compose (local Postgres) · local
filesystem storage provider (swappable for S3-compatible storage).

## Quick start

```bash
docker compose up -d          # starts local PostgreSQL on :5432
cp .env.example .env          # copy env contract (defaults work out of the box)
npm install
npx prisma migrate dev        # applies schema, creates DB
npm run db:seed               # seeds demo accounts, brokers, properties, applications
npm run dev                   # http://localhost:3000
```

Production build:

```bash
npm run build
npm run start
```

## Demo accounts

All seeded users share the password in `SEED_USER_PASSWORD`
(`.env.example` default: `DldPartners#2026`). Sign in at `/partner/login` —
admin-type roles are redirected to `/admin`, broker/partner roles to
`/partner/dashboard`.

| Email | Role |
|---|---|
| admin@dldpartners.local | Super Admin |
| compliance@dldpartners.local | Compliance Manager |
| sales@dldpartners.local | Sales Manager |
| partner.manager@dldpartners.local | Partner Manager |
| broker@dldpartners.local | Broker (Ahmed Al Mansoori — has seeded listings, clients, leads) |
| company@dldpartners.local | Partner Company (Emirates Prime Brokerage) |

All demo data is clearly synthetic (`.local` / `.example` emails, "Demo
listing" descriptions) — see `DEMO_DATA_DISCLAIMER` in
`src/lib/constants/index.ts` and the on-page disclaimer under the homepage
hero.

## Environment variables

See `.env.example` for the full contract (validated at boot by
`src/lib/env.ts` — the app refuses to start with a missing/invalid value).
Key variables:

- `DATABASE_URL` — Postgres connection string
- `AUTH_SECRET` — session signing secret (replace for any non-local use)
- `NEXT_PUBLIC_WHATSAPP_NUMBER` — number used by every WhatsApp CTA
- `DLD_OFFICIAL_VERIFICATION_URL` / `..._BROKER_DIRECTORY_URL` /
  `..._COMPANY_DIRECTORY_URL` — optional official DLD links shown in the UI
  when configured; the app never claims official verification without one
- `STORAGE_PROVIDER` / `UPLOAD_DIR` — local filesystem document storage
- `SEED_USER_PASSWORD` — shared password for all seeded demo accounts

## Database

```bash
npx prisma migrate dev     # create/apply a migration in development
npx prisma migrate deploy  # apply migrations in production
npx prisma studio          # inspect data
npm run db:seed            # re-run the seed (idempotent upserts)
```

## Tests

```bash
npm run lint
npm run typecheck
npm run test        # Vitest: unit + integration (integration tests need the
                     # local Postgres from docker compose + seed data)
npm run test:e2e     # Playwright — run `npx playwright install` once first,
                     # and have `npm run dev` reachable at localhost:3000
```

Unit tests cover the deterministic matching engine, the RBAC permission
matrix (deny-by-default), DLD verification-label compliance guardrails
(never claims official DLD verification without an authorized source), the
WhatsApp link builder, and compliance document expiry logic. Integration
tests exercise property search against the real seeded database. E2E specs
cover the public homepage/property/broker/partner-apply journeys.

## Architecture

Modular monolith with domain boundaries under `src/modules/*`
(properties, brokers, partners, crm, leads, compliance, admin) and
cross-cutting services under `src/server/*` (auth, rbac, audit, storage,
notifications, dld, matching). See `docs/ARCHITECTURE.md`, `docs/API.md`,
`docs/RBAC.md`, and `docs/DLD-COMPLIANCE.md` for the design contracts this
build follows, and `.claude/PROJECT_STATE.md` for build history and status.

### Security notes

- Every mutating API route re-derives the caller's roles from the signed
  session (never trusts client-sent role data), enforces permissions via
  `src/server/rbac`, and scopes partner-owned resources to their own
  partner ID unless a broader permission is granted.
- Privileged actions write an `AuditLog` row (`src/server/audit/log.ts`).
- Compliance documents are stored outside `public/` and served only via a
  signed, time-limited, session-authenticated route
  (`/api/compliance/documents/file`) — never through a public URL.
- Verification labels are strictly guarded: `PLATFORM_VERIFIED` /
  `Verification Pending` for internal review, and `Verified against
  official DLD source` only when data is genuinely sourced from an
  authorized DLD integration (none exists in this MVP — the manual
  verification endpoint cannot set that status).

## Known limitations (MVP scope)

- No authorized DLD API integration exists yet (Tier 2 in
  `docs/DLD-COMPLIANCE.md`) — verification is Tier 3/4 (partner-submitted +
  manual compliance review) plus Tier 1 official links when configured.
  Live DLD data is never fabricated.
- Notifications use a development provider that logs to the server console
  instead of sending real email/SMS/WhatsApp messages — swap
  `src/server/notifications` for a production provider behind the same
  interface.
- Playwright e2e tests must run with a single worker
  (`playwright.config.ts` sets `workers: 1`) — this sandboxed dev VM can't
  sustain multiple parallel Chromium instances (they crash under
  contention). 4/4 e2e specs pass serially. Also note: seed data uses
  external Unsplash image URLs, and this sandbox has no outbound network
  access from the browser, so the specs abort `images.unsplash.com`
  requests via `page.route()` — real/production environments with internet
  access don't need this, but leaving it in is harmless.
- Object storage uses the local filesystem provider; swap
  `src/server/storage` for an S3-compatible provider for production.
- Public partner application → admin approval provisions a real login
  account with a generated temporary password logged via the notification
  provider — production would need a proper invite/reset-password email
  flow instead of logging the password.

## Phase 2 backlog (explicitly out of MVP scope)

Developer portal, property owner portal, advanced/AI-assisted CRM, lead
marketplace, AI property/lead-scoring assistant, commission management,
advanced analytics & broker performance ranking, automated marketing/CMS.
Extension points are already isolated (matching engine, DLD adapter,
storage/notification interfaces) so these can be added without rearchitecting
Phase 1.
