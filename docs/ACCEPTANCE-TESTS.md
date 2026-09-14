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
