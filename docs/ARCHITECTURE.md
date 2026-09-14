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
  getSignedUrl(...)
  delete(...)
}
Local provider for development; S3-compatible provider later.

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
