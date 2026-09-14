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
