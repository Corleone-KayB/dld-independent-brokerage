# API Contracts

All JSON responses use:
```json
{ "data": {}, "error": null, "meta": {} }
```
Errors:
```json
{ "data": null, "error": { "code": "VALIDATION_ERROR", "message": "..." }, "meta": {} }
```

## Auth
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/otp/request
POST /api/auth/otp/verify

## Properties
GET /api/properties
GET /api/properties/:id
POST /api/properties
PATCH /api/properties/:id
DELETE /api/properties/:id

Query filters:
- purpose: BUY | RENT | COMMERCIAL | OFF_PLAN | LUXURY | INVESTMENT | HOLIDAY
- location
- community
- propertyType
- minPrice/maxPrice
- minBedrooms/maxBedrooms
- minBathrooms/maxBathrooms
- minSize/maxSize
- furnishing
- completionStatus
- developerId
- minYield
- page
- pageSize

Public GET endpoints may be unauthenticated. Mutations require authenticated roles.

## Brokers
GET /api/brokers
GET /api/brokers/:id
GET /api/brokers/:id/verification
POST /api/brokers/apply

## Partners
POST /api/partners/apply
GET /api/partners
GET /api/partners/:id
PATCH /api/partners/:id/status

Partner status:
PENDING_VERIFICATION | UNDER_REVIEW | APPROVED | REJECTED | MORE_INFORMATION_REQUIRED | SUSPENDED

## CRM
GET /api/clients
POST /api/clients
GET /api/clients/:id
PATCH /api/clients/:id

GET /api/leads
POST /api/leads
GET /api/leads/:id
PATCH /api/leads/:id
POST /api/leads/:id/assign

Lead status:
NEW | CONTACTED | QUALIFIED | VIEWING | NEGOTIATION | OFFER | CONTRACT | CLOSED | LOST

POST /api/appointments
GET /api/appointments
PATCH /api/appointments/:id

## Matching
POST /api/matching/properties
Input:
{
  "budget": 2500000,
  "purpose": "INVESTMENT",
  "locations": ["Dubai Marina", "Business Bay", "JVC"],
  "bedrooms": 2,
  "minimumYield": 6,
  "completionStatus": "READY"
}

Output returns ranked properties with deterministic `matchScore` 0-100 and reasons.

## Compliance
GET /api/compliance
POST /api/compliance/documents
PATCH /api/compliance/documents/:id
POST /api/compliance/documents/:id/verify

## Developer Portal (Phase 2)
GET /api/developers
GET /api/developers/:id
POST /api/developers/:id/projects
GET /api/developers/:id/projects
GET /api/projects/:id
PATCH /api/projects/:id
POST /api/projects/:id/units
PATCH /api/project-units/:id

## Property Owner Portal (Phase 2)
POST /api/properties/owner-submissions (public — "List My Property")

## Deal Management + Commission Management (Phase 2)
GET /api/deals
POST /api/deals
GET /api/deals/:id
PATCH /api/deals/:id/stage
GET /api/commissions
PATCH /api/commissions/:id/status

## Lead Marketplace (Phase 2)
GET /api/leads/marketplace
POST /api/leads/:id/accept

## AI Property Advisor + AI Broker Assistant (Phase 2, deterministic — see docs/DLD-COMPLIANCE.md-style honesty note in ARCHITECTURE.md)
POST /api/advisor/properties (public)
POST /api/assistant/query (broker, scoped to own CRM)

## Advanced Analytics (Phase 2)
GET /api/analytics/overview
POST /api/analytics/track (public, fire-and-forget enquiry/view logging)

## Automated Marketing (Phase 2)
GET /api/blog
POST /api/blog
GET /api/blog/:id
PATCH /api/blog/:id
DELETE /api/blog/:id
GET /api/banners
POST /api/banners
PATCH /api/banners/:id
DELETE /api/banners/:id

## DLD Independent Brokerage Network (Phase 3)

### Membership & connections
PATCH /api/network/opt-in — { optIn: boolean }
GET /api/network/brokers — discovery (opted-in brokers only, excludes self, annotated with connection status)
GET /api/network/connections — own incoming/outgoing/accepted/past
POST /api/network/connections — { targetBrokerId } (rate-limited)
POST /api/network/connections/:id/accept
POST /api/network/connections/:id/decline
POST /api/network/connections/:id/revoke

### Secure messaging (requires an ACCEPTED connection)
GET /api/network/conversations
POST /api/network/conversations — { brokerId } (gets or creates)
GET /api/network/conversations/:id/messages (polling; also marks read)
POST /api/network/conversations/:id/messages — { body }

### Referrals & lead exchange (no connection required)
GET /api/network/referrals — { sent, received }
POST /api/network/referrals — { receivingBrokerId, clientSnapshotName, clientSnapshotPhone?, clientSnapshotEmail?, clientSnapshotBudget?, requirementNotes?, proposedSplitPercent?, sourceLeadId? } (rate-limited, per-target and total)
POST /api/network/referrals/:id/accept — locks proposedSplitPercent into acceptedSplitPercent, creates a Client+Lead for the receiving broker
POST /api/network/referrals/:id/decline — { reason? }
POST /api/network/referrals/:id/cancel — requester only, while SENT
POST /api/network/referrals/:id/status — { status: IN_PROGRESS|CONVERTED|CLOSED, resultingDealId? } — receiving broker only
GET /api/network/referrals/brokers — target picker (any verified broker, no opt-in required)

Referral status: SENT | ACCEPTED | DECLINED | IN_PROGRESS | CONVERTED | CLOSED | EXPIRED | CANCELLED

### Deal collaboration (no connection required)
GET /api/deals/:id/collaborators — deal owner or admin
POST /api/deals/:id/collaborators — { brokerId, role, splitPercent? } (rate-limited)
GET /api/deals/collaborations — deals another broker invited me to
POST /api/deals/collaborations/:id/accept — invited broker only
POST /api/deals/collaborations/:id/decline — invited broker only
POST /api/deals/collaborations/:id/remove — deal owner, the collaborator themselves, or admin

Collaborator role: LISTING_BROKER | BUYER_BROKER | REFERRING_BROKER | CO_BROKER
Collaborator status: INVITED | ACCEPTED | DECLINED | REMOVED

### Listing/lead sharing (no connection required, unilateral grant + revoke)
GET /api/properties/:id/shares — property owner (partner-team scope) or admin
POST /api/properties/:id/shares — { targetBrokerId } (rate-limited)
POST /api/properties/shares/:id/revoke
GET /api/properties/shared-with-me — listings other brokers have shared with me

### Commission splitting (finance/admin-only, independent per-split approval)
GET /api/commissions/:id/splits
POST /api/commissions/:id/splits — { brokerId, percent } (amount computed from the commission total; sum of non-rejected splits capped at 100%)
POST /api/commissions/splits/:id/approve
POST /api/commissions/splits/:id/reject — { reason }
POST /api/commissions/splits/:id/pay — only from APPROVED
GET /api/commissions/splits/mine — a broker's own payout view
GET /api/commissions/splits/candidate-brokers — broker picker for the create form

Split status: PENDING | APPROVED | PAID | REJECTED. A holder of `commissions:manage` cannot approve/reject/pay a split that pays out to their own broker identity.

### Reputation (peer reviews only)
GET /api/reviews — completed deals/referrals this broker hasn't reviewed the other party for yet
POST /api/reviews — { revieweeBrokerId, dealId? XOR referralId?, rating (1-5), comment? } — deal must be CLOSED, referral must be CONVERTED/CLOSED; one review per reviewer per context, immutable once submitted
GET /api/reviews/mine — reviews received

## Security
Every mutation:
- validates body
- authenticates
- authorizes
- applies resource scope
- writes audit event where required
