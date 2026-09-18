# MVP Acceptance Tests

## A01 — Public homepage
Given a fresh install, visiting `/` renders the premium homepage with:
- Explore Properties
- Become a Partner
- Verify a Broker
and no runtime errors.

## A02 — Property search
A user can open `/properties`, filter by purpose/location/price/bedrooms, paginate results, and open a property detail page.

## A03 — Property detail
Property detail displays gallery placeholder/demo images, specifications, verification status, assigned broker, and working WhatsApp/contact CTA.

## A04 — Broker directory
User can search/filter brokers and open a broker profile.

## A05 — Partner application
Unauthenticated user can complete the multi-step partner application and submit it. Application is persisted with PENDING_VERIFICATION.

## A06 — Admin application review
Admin can view application and change it to UNDER_REVIEW, APPROVED, REJECTED, or MORE_INFORMATION_REQUIRED. Every privileged status change creates an audit log.

## A07 — Authentication
Seeded broker/admin accounts can log in and reach their permitted dashboards.

## A08 — RBAC denial
Broker cannot access admin routes or approve partner applications through direct API calls. API returns 403.

## A09 — Broker CRM
Broker can create a client, create a lead, view the lead pipeline, update status, add an activity, and schedule an appointment.

## A10 — Lead assignment
Sales Manager/Admin can assign a lead to an eligible broker. Broker can see assigned lead.

## A11 — Property ownership
Broker can create/edit their own listing. Broker cannot edit another broker's listing unless granted a broader permission.

## A12 — Compliance
Compliance Manager can see required documents, upload/register a document record, verify it, and see expiry state.

## A13 — Verification labels
Demo/manual verification is shown as Platform Verified. No screen falsely claims official DLD verification.

## A14 — Matching
Given a seeded client/request and inventory, `/api/matching/properties` returns deterministic ranked matches and scores.

## A15 — Release
Install → env setup → database migration → seed → lint → typecheck → tests → build all succeed.

## Phase 2

## A16 — Developer Portal
A developer partner can create a project (goes to Pending Review), add units, and see it listed once an admin publishes it. Public `/developers` and `/developers/[slug]` show only published projects.

## A17 — Property Owner Portal
An unauthenticated user can submit "List My Property" via `/list-property`. Choosing "let us match" auto-suggests a verified broker serving the listed area; choosing an explicit broker respects that choice. The listing appears in Admin Property Moderation as an Owner Submission.

## A18 — Deal & Commission Management
A broker can create a deal and advance its stage. Reaching the Commission stage auto-creates a commission at the default rate. Only Finance/Admin (`commissions:manage`) can approve, mark paid, or dispute a commission — a broker attempting this via direct API call gets 403.

## A19 — Lead Marketplace
A new lead with no broker match is auto-scored and, if no fit exists on its own team, can be released to the marketplace by Sales/Admin. Any verified broker can view and accept it via `/partner/dashboard/marketplace`, which reassigns the lead to their own partner/broker.

## A20 — AI Property Advisor / Broker Assistant
The Investor Hub's Property Advisor returns ranked matches with rental-income/yield figures computed from real listing data (never fabricated numbers) and clearly states it is a deterministic engine, not an external AI model. The Broker Assistant correctly parses the spec's example query ("2-bedroom properties under AED 1.8M") into bedrooms/budget filters.

## A21 — Investor Calculators
Each of the 8 calculators (`/calculators`) produces a result from user-entered numbers with no network round-trip.

## A22 — Advanced Analytics
`/admin/analytics` (gated by `analytics:view`) shows leads by source/area/broker, conversion rate, views, enquiries, viewings, offers, deals, revenue, commission, community performance, and a broker performance ranking — all computed from live data.

## A23 — Automated Marketing
Marketing Manager (or Admin) can publish a blog post and activate a homepage banner via `/admin/marketing`. Published posts appear at `/blog`; a non-marketing role attempting to create a post via direct API call gets 403.

## Phase 3 — DLD Independent Brokerage Network

## A24 — Network membership & connections
A broker opts into the network (`Broker.networkOptIn`), appears in another opted-in broker's discovery list, sends a connection request, and the recipient accepts it. Neither side can message the other before the connection is `ACCEPTED`; a duplicate request while one is pending is rejected regardless of which side re-sends it.

## A25 — Secure messaging
Two connected brokers can exchange messages via `/partner/dashboard/messages`. A broker who is not a participant in a conversation cannot read or send messages in it (rejected, not just hidden in the UI). Messaging without a prior accepted connection is rejected.

## A26 — Referrals & lead exchange
A broker sends a referral (client snapshot + proposed commission split) to another broker with no prior connection required. The receiving broker accepts it, which locks the proposed split into an immutable accepted split and creates a real Client+Lead in their own CRM. A second referral request to the same broker beyond the daily limit is rejected.

## A27 — Deal collaboration
A deal's own broker invites another broker as a collaborator; the invited broker accepts via `/partner/dashboard/collaborations`. A broker who is neither the deal owner, an admin, nor a collaborator on that deal cannot view the deal (404, not 403, to avoid confirming its existence).

## A28 — Listing/lead sharing
A broker shares one of their own listings with another broker (no connection required); the recipient sees it under "Shared With Me." Revoking the share removes it from the recipient's list; re-sharing after a revoke reactivates the same record rather than duplicating it.

## A29 — Commission splitting
Only Finance/Admin (`commissions:manage`) can create a split on a commission, approve it, reject it, or mark it paid — a broker attempting any of these via direct API call gets 403. Splits on one commission cannot be allocated beyond 100% in total. A Finance Manager who also holds a Broker profile cannot approve/reject/pay a split that pays out to themselves.

## A30 — Reputation (peer reviews)
A broker can leave a review for another broker only after a deal they collaborated on together is `CLOSED`, or a referral between them is `CONVERTED`/`CLOSED` — attempting to review before that point is rejected. A second review for the same deal/referral by the same reviewer is rejected. The reviewee's aggregate rating recomputes automatically and appears (as a count/rating only, never an AED figure) on their public profile.

## A31 — Network performance tracking
The admin Broker Performance Ranking (`/admin/analytics`) shows each broker's active connections, referrals completed, deal collaborations, and peer rating alongside the existing weighted score. A broker's own dashboard overview shows the same activity for themselves.

## A32 — Phase 3 regression
All MVP (A01–A15) and Phase 2 (A16–A23) acceptance tests continue to pass unmodified — Phase 3 introduces no changes to any pre-existing model column, permission, or page behavior.

Redeploy
