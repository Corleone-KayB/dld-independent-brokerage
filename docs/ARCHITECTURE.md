# Architecture

## Domain modules
Properties, Brokers, Partners, CRM, Leads, Compliance, Admin.

## Cross-cutting services
Auth, RBAC, Audit, Storage, Notifications, DLD links, Matching.

## Data flow
Public enquiry → Lead → qualification → property matching → broker assignment → client activity → appointment → offer/deal extension.

## DLD integration
MVP uses a DLD adapter with:
- official verification URL configuration
- source label
- last checked timestamp
- external reference/card number fields where appropriate

Do not scrape or impersonate internal DLD systems.
Authorized API integration is an extension point and must only be enabled with legitimate credentials/access.

## Storage
Use:
interface StorageProvider {
  upload(...)
  read(...)
  getSignedUrl(...)
  delete(...)
}
Local filesystem provider for development (`STORAGE_PROVIDER=local`). A
Vercel Blob provider (`STORAGE_PROVIDER=vercel-blob`, `src/server/storage/
vercel-blob-provider.ts`) ships for serverless hosting, since Vercel's
filesystem is ephemeral and not shared across instances — required when
deploying to Vercel. Both providers only ever expose files through the
signed, session-authenticated `/api/compliance/documents/file` route; the
underlying blob URL is never sent to the client. An S3-compatible provider
remains a future extension point behind the same interface.

## Notifications
Use:
interface NotificationProvider {
  email(...)
  sms(...)
  whatsapp(...)
  inApp(...)
}
Development provider logs safely.

## Matching
Deterministic weighted scoring in MVP. Keep algorithm isolated so an AI/ML implementation can replace it later.

## Phase 2 additions

### Developer Portal
`Developer` (1:1 with a `Partner` of type DEVELOPER) owns `Project`s, each with `ProjectUnit`s and `ProjectImage`s. Projects go through the same DRAFT → PENDING_REVIEW → PUBLISHED → ARCHIVED lifecycle as properties (reuses `PropertyStatus`) and the same admin moderation pattern.

### Property Owner Portal
Public "List My Property" creates a `Property` directly (no partner required yet — `partnerId` is nullable) with owner contact fields and either an explicit `preferredBrokerId` or `matchRequested = true`, in which case `src/server/matching/broker-match.ts` auto-suggests a verified broker.

### Deal Management + Commission Management
`Deal` tracks the transaction pipeline beyond a `Lead` (`VIEWING → OFFER → NEGOTIATION → MOU → CONTRACT → PAYMENT → TRANSFER → COMMISSION → CLOSED`). Reaching `COMMISSION` auto-creates a `Commission` at the default rate (`COMMISSION_DEFAULT_RATE`) if the deal has a value and none exists yet — idempotent.

### Lead Marketplace + Lead Distribution Engine + AI Lead Scoring
Every lead is auto-scored on creation (`src/server/matching/lead-scoring.ts`) and, if unassigned, auto-routed to the best-fit verified broker on its own partner team (`src/server/matching/broker-match.ts`). Sales/Admin can additionally release a lead to the cross-partner marketplace (`Lead.visibility = MARKETPLACE`); any verified broker can accept it, which transactionally reassigns `partnerId` + `brokerId`.

### AI Property Advisor + AI Broker Assistant
**Both are deterministic, not calls to an external LLM** (no API key is configured; consistent with the MVP's own decision to keep property matching deterministic). The Advisor (`src/server/advisor/property-advisor.ts`) combines the matching engine with figures computed directly from listing data (rental income, yield, risk notes) and never fabricates a number the data doesn't support. The Assistant (`src/server/assistant/broker-assistant.ts`) is a transparent regex-based parser (bedrooms/budget/area) over the broker's own CRM data. UI copy states this plainly rather than implying a chatbot.

### Investor Tools
Pure calculation functions in `src/lib/calculators/index.ts` (rental yield, ROI, mortgage amortization, UAE-mortgage-cap-tiered down payment, affordability, capital appreciation, investment comparison, off-plan payment-plan split) — no external service, fully unit-tested.

### Advanced Analytics + Broker Performance Ranking
`src/modules/analytics/service.ts` aggregates real data only (leads by source/area/broker, conversion, views, enquiries, viewings, offers, deals, revenue, commission). Geographic analytics is scoped to a community-performance table (reusing the Advisor's `compareAreas`), not a literal interactive map — no mapping stack exists in this project, and adding one was out of scope for this pass. `src/server/analytics/broker-performance.ts` computes a deterministic weighted ranking (conversion, closed deals, commission earned, active listings).

### Automated Marketing (scoped)
Deliberately scoped to Blog + Banners + SEO metadata fields — not a full drag-and-drop page builder (that's the broader §24 vision, not what Phase 2's bullet list actually names). Blog content renders as plain text (`whitespace-pre-line`), matching the existing property-description pattern; no markdown/WYSIWYG dependency was added.

## Phase 3 additions — DLD Independent Brokerage Network

Nine new models (`src/modules/network`, `src/modules/messaging`, `src/modules/referrals`, `src/modules/deal-collaboration`, `src/modules/property-sharing`, `src/modules/commission-splits`, `src/modules/reputation`), all additive — zero changes to any MVP/Phase 2 column type or constraint. Six business decisions (recorded in the Phase 3 log below) shaped every feature group; nothing here invents a business rule beyond them.

### Network membership & connections
`Broker.networkOptIn` is the "join the network" switch; `NetworkConnection` is a specific peer relationship on top of it. `brokerAId`/`brokerBId` are canonically ordered (lower id first) so a pair has exactly one row regardless of who initiates, with a separate `requesterId` recording who actually sent the request — this is what lets `@@unique([brokerAId, brokerBId])` block a duplicate request from either direction.

### Secure messaging
The **only** Phase 3 feature gated on a prior `NetworkConnection` (`ACCEPTED` status, re-verified server-side on every call). Authenticated polling (`MessageThread` refetches every 4s) — no WebSocket/pub-sub dependency was added.

### Referrals, deal collaboration, and listing sharing
These three deliberately need **no** prior connection — each is its own anti-abuse rate limit instead (`src/server/security/rate-limit.ts`, a DB-backed sliding-window `COUNT`, no new infra). Referral terms are two-stage and immutable: `proposedSplitPercent`/`proposedAt` (sent) vs. `acceptedSplitPercent`/`acceptedAt`/`acceptedByUserId` (locked forever once set, never rewritten). Accepting a referral materializes the client snapshot into a real `Client`+`Lead` in the receiving broker's CRM — a referral is a handoff, not just metadata. Deal collaboration (`DealCollaborator`) is purely additive to the existing single-owner `Deal.brokerId` — zero collaborators behaves exactly as before Phase 3. Listing sharing (`PropertyShare`) is a unilateral grant + revoke, no accept/decline step.

### Commission splitting
`CommissionSplit` carries its own amount/beneficiary/status/rejection-reason/approved-by/approved-at/paid-at — creation and every status transition are finance/admin-only (`commissions:manage`, reused rather than duplicated), with a sum-≤100%-of-the-commission integrity check enforced transactionally, and a self-dealing guard blocking a dual-role user from approving a payout to their own broker identity. Amounts are computed once at creation and never recalculated.

### Reputation
Peer-only (`BrokerReview`) — no client-facing reviews anywhere in this codebase. Gated to a *completed* collaboration: a deal at the `CLOSED` stage (the actual terminal `DealStage` — `COMMISSION` only marks when commission tracking begins) or a referral at `CONVERTED`/`CLOSED`. One review per reviewer per context, enforced by hand-written partial unique indexes (Prisma's schema DSL can't express a conditional unique constraint on `dealId`/`referralId`, same technique as Phase 2's `Developer.slug`). Submitting a review recomputes `Broker.rating` — a field that existed since the MVP schema but was never written to until this feature — as a simple average, in the same transaction as the insert.

### Network performance tracking
`src/server/analytics/broker-performance.ts` gained `getNetworkActivity()` (connections, referrals completed, deal collaborations, listings shared, review count, rating), reported alongside — not blended into — the existing weighted `performanceScore`, since no business decision assigned network activity a weight there. The public broker profile shows only counts and rating, never an AED figure — commission/deal value stay dashboard-only.

### Ownership pattern for broker-identity resources
`src/server/rbac/ownership.ts` adds `isInvolvedBroker()` alongside the existing `ownsPartnerResource()` — for resources owned by broker *identity* rather than partner membership (a connection, a collaboration invite): "you are the invited/addressed party," optionally still admitting a broad manage-all permission. It was extracted into its own dependency-free module (no `next-auth` import) so it can be unit-tested directly — importing it via `guard.ts` (which imports `next-auth` for `auth()`) fails in Vitest's node test environment.
