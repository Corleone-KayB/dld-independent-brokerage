# DLD Independent Brokerage Partners

A private digital brokerage/real-estate platform for Dubai's independent
brokers and brokerage partners. **This is not an official Dubai Land
Department (DLD) platform** — it is an independent private network that
complements official DLD services and links out to them for official
verification.

**Phase 1 (MVP) + Phase 2 + Phase 3 complete.** Phase 1: public marketplace,
broker directory, partner onboarding, embedded CRM, compliance center, admin
console, deterministic property matching, audit logging. Phase 2 adds: a
Developer Portal, a Property Owner Portal, Deal & Commission Management, a
cross-partner Lead Marketplace with automatic lead scoring/distribution, a
deterministic AI Property Advisor and Broker Assistant, Investor Tools (8
ROI/mortgage/affordability calculators), Advanced Analytics with Broker
Performance Ranking, and a scoped Automated Marketing module (blog +
banners + SEO metadata). Phase 3 adds the **DLD Independent Brokerage
Network** — broker-to-broker membership & connections, secure messaging,
referrals & lead exchange, deal collaboration, listing/lead sharing,
commission splitting, peer reputation, and network performance tracking.

## Stack

Next.js 15 (App Router, TypeScript, strict mode) · Tailwind CSS · PostgreSQL
· Prisma · Zod · Auth.js (NextAuth v5, credentials + JWT sessions) · Vitest ·
Playwright · ESLint/Prettier · Docker Compose (local Postgres) · pluggable
storage provider — local filesystem for development, Vercel Blob
(`@vercel/blob`) for serverless hosting, both behind the same interface (see
"Storage" below). No other new runtime dependencies were added across Phase
2 or Phase 3 — every calculator, scoring, matching, and network engine is
plain TypeScript against the existing stack.

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
admin-type roles are redirected to `/admin`, broker/partner/developer roles
to `/partner/dashboard`.

| Email | Role |
|---|---|
| admin@dldpartners.local | Super Admin |
| compliance@dldpartners.local | Compliance Manager |
| sales@dldpartners.local | Sales Manager |
| partner.manager@dldpartners.local | Partner Manager |
| broker@dldpartners.local | Broker (Ahmed Al Mansoori — has seeded listings, clients, leads, a deal + commission) |
| company@dldpartners.local | Partner Company (Emirates Prime Brokerage) |
| developer@dldpartners.local | Developer (Meraas Demo Developer — has a published project + 3 units) |

All demo data is clearly synthetic (`.local` / `.example` emails, "Demo
listing"/"(Demo)" descriptions) — see `DEMO_DATA_DISCLAIMER` in
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
- `STORAGE_PROVIDER` — `local` (default, filesystem under `UPLOAD_DIR`) or
  `vercel-blob` (required when hosting on Vercel, whose filesystem is
  ephemeral); `vercel-blob` requires `BLOB_READ_WRITE_TOKEN` from a Vercel
  Blob store — `env.ts` refuses to boot with `STORAGE_PROVIDER=vercel-blob`
  and no token set
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
npm run test        # Vitest: 143 unit + integration tests (integration tests
                     # need the local Postgres from docker compose + seed data)
npm run test:e2e     # Playwright — 9 specs. Run `npx playwright install` once
                     # first, and have `npm run dev` reachable at localhost:3000
```

Unit tests cover: the deterministic property-matching, broker-matching,
lead-scoring, and broker-performance engines; all 8 investor calculators
(including a round-trip consistency check between the affordability and
mortgage formulas); the AI Property Advisor and Broker Assistant query
parser; the RBAC permission matrix (deny-by-default); DLD verification-label
compliance guardrails; the WhatsApp link builder; compliance document expiry
logic; anti-abuse rate limiting; and broker-identity ownership checks.
Integration tests exercise the full Phase 2 + Phase 3 feature set against the
real seeded database: developer/project publishing, owner-listing submission
+ auto-match, deal→commission creation, lead distribution + marketplace
accept, analytics aggregation, marketing content visibility, network
connections, secure messaging, referrals & lead exchange, deal
collaboration, listing sharing, commission splitting, peer reviews, and
network performance metrics. Phase 3 integration tests use disposable
fixture brokers/partners created per test file (rather than the shared seed
accounts) so they stay safe under Vitest's parallel file execution. E2E specs
cover the public homepage/property/broker/partner-apply journeys plus the
developer/investor/calculators/blog/list-property pages.

## Architecture

Modular monolith with domain boundaries under `src/modules/*`
(properties, brokers, partners, crm, leads, compliance, admin, developers,
deals, commissions, analytics, marketing) and cross-cutting services under
`src/server/*` (auth, rbac, audit, storage, notifications, dld, matching,
advisor, assistant, analytics). See `docs/ARCHITECTURE.md`, `docs/API.md`,
`docs/RBAC.md`, and `docs/DLD-COMPLIANCE.md` for the design contracts this
build follows, and `.claude/PROJECT_STATE.md` for the full build history
(both phases) and status.

### Security notes

- Every mutating API route re-derives the caller's roles from the signed
  session (never trusts client-sent role data), enforces permissions via
  `src/server/rbac`, and scopes partner-owned resources to their own
  partner ID unless a broader permission is granted. Endpoints needing both
  an own-scope and a manage-all permission use `requireAnyPermission()` so
  admin roles aren't wrongly denied (see `src/server/rbac/guard.ts`).
- Privileged actions write an `AuditLog` row (`src/server/audit/log.ts`).
- Compliance documents are stored outside `public/` and served only via a
  signed, time-limited, session-authenticated route
  (`/api/compliance/documents/file`) — never through a public URL.
- Verification labels are strictly guarded: `PLATFORM_VERIFIED` /
  `Verification Pending` for internal review, and `Verified against
  official DLD source` only when data is genuinely sourced from an
  authorized DLD integration (none exists in this build — the manual
  verification endpoint cannot set that status).
- **"AI" features are honestly labeled.** AI Lead Scoring, the AI Property
  Advisor, and the AI Broker Assistant are all deterministic, transparent
  rule/formula engines — no external LLM is called (none is configured),
  and the UI says so rather than implying a chatbot. Same precedent as the
  MVP's deterministic property-matching engine.

## Known limitations

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
  contention). Also note: seed data uses external Unsplash image URLs, and
  this sandbox has no outbound network access from the browser, so the
  specs abort `images.unsplash.com` requests via `page.route()` —
  real/production environments with internet access don't need this, but
  leaving it in is harmless.
- Object storage defaults to the local filesystem provider for development.
  A Vercel Blob provider (`STORAGE_PROVIDER=vercel-blob`) is available for
  serverless hosting; an S3-compatible provider remains a future extension
  point behind the same `StorageProvider` interface if hosting elsewhere.
- Public partner application → admin approval provisions a real login
  account with a generated temporary password logged via the notification
  provider — production would need a proper invite/reset-password email
  flow instead of logging the password.
- Geographic analytics ("Hot Areas") is a community-performance table, not a
  literal interactive Dubai map — no mapping stack exists in this project;
  adding one was out of scope for this pass.
- Automated Marketing is scoped to Blog + Banners + SEO metadata — not a
  full drag-and-drop CMS page builder (that's the broader long-term vision
  in the spec, not what Phase 2's explicit feature list names).
- Phase 3 network messaging uses authenticated polling (refetch every 4s),
  not WebSockets/pub-sub — consistent with every other page in this
  codebase and explicitly decided rather than defaulted into.
- Phase 3 referral status `EXPIRED` is defined in the schema but nothing
  sets it — there is no scheduled/background job runner anywhere in this
  project, so automatic expiry has no honest implementation yet.
- Phase 3 reviews are peer-only and immutable once submitted; there is no
  admin moderation/dispute UI for a review in v1 (the spec and the 6
  business decisions that scoped this phase don't call for one).
