# RBAC Matrix

## Roles
- SUPER_ADMIN
- ADMINISTRATOR
- COMPLIANCE_MANAGER
- SALES_MANAGER
- PARTNER_MANAGER
- BROKER
- PARTNER_COMPANY
- PROPERTY_OWNER
- DEVELOPER
- BUYER
- TENANT
- INVESTOR
- MARKETING_MANAGER
- FINANCE_MANAGER
- SUPPORT_AGENT

## MVP permissions

| Permission | Super Admin | Admin | Compliance | Sales | Partner Mgr | Broker | Partner Co | Support |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| view public properties | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| manage all properties | ✓ | ✓ |  | ✓ | ✓ |  |  |  |
| manage own listings | ✓ | ✓ |  | ✓ | ✓ | ✓ | ✓ |  |
| view partner applications | ✓ | ✓ | ✓ |  | ✓ |  |  |  |
| approve/reject partners | ✓ | ✓ | ✓ |  | ✓ |  |  |  |
| verify compliance docs | ✓ |  | ✓ |  |  |  |  |  |
| suspend partner | ✓ | ✓ | ✓ |  | ✓ |  |  |  |
| view own clients | ✓ | ✓ |  | ✓ | ✓ | ✓ | ✓ | limited |
| manage own leads | ✓ | ✓ |  | ✓ | ✓ | ✓ | ✓ | limited |
| assign leads | ✓ | ✓ |  | ✓ | ✓ | ✓ |  |  |
| view audit logs | ✓ | ✓ | ✓ |  |  |  |  |  |
| manage system settings | ✓ | ✓ |  |  |  |  |  |  |
| view commissions | ✓ | ✓ |  |  |  | ✓ | ✓ |  |

All access must be enforced on the server. UI hiding is not authorization.

## Resource ownership
BROKER and PARTNER_COMPANY users can only access resources belonging to their partner/organization unless a permission explicitly grants broader scope.

## Deny by default
New roles and permissions must be explicitly granted. Unknown permissions are denied.

## Phase 2 permissions

| Permission | Super Admin | Admin | Sales Mgr | Partner Mgr | Broker | Partner Co | Developer | Finance Mgr | Marketing Mgr |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| manage own developer projects | ✓ |  |  |  |  |  | ✓ |  |  |
| manage own deals | ✓ |  |  |  | ✓ | ✓ |  |  |  |
| manage all deals | ✓ | ✓ | ✓ | ✓ |  |  |  |  |  |
| manage commissions (approve/pay/dispute) | ✓ |  |  |  |  |  |  | ✓ |  |
| view/accept lead marketplace | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  |  |  |
| manage marketing content (blog/banners) | ✓ |  |  |  |  |  |  |  | ✓ |
| view advanced analytics | ✓ | ✓ | ✓ | ✓ |  |  |  | ✓ | ✓ |

Endpoints requiring both an "own-scope" permission (e.g. `deals:manage_own`) and a broader "manage-all" role use `requireAnyPermission()` so admin-level roles — which hold the manage-all permission but never the own-scope one — aren't wrongly denied. `src/server/rbac/guard.ts` documents this pattern.

## Phase 3 permissions — DLD Independent Brokerage Network

| Permission | Super Admin | Administrator | Compliance Mgr | Finance Mgr | Broker | Partner Co |
|---|---:|---:|---:|---:|---:|---:|
| network:connect (opt-in, connect/accept/decline/revoke) | ✓ |  |  |  | ✓ | ✓ |
| network:message (direct messaging, requires an accepted connection) | ✓ |  |  |  | ✓ | ✓ |
| referrals:manage_own (send/accept/decline/cancel/advance) | ✓ |  |  |  | ✓ | ✓ |
| deals:collaborate (invite/accept/decline/remove collaborators) | ✓ |  |  |  | ✓ | ✓ |
| commission_splits:view_own (own payout visibility) | ✓ |  |  |  | ✓ | ✓ |
| listings:share_own (grant/revoke a listing share) | ✓ |  |  |  | ✓ | ✓ |
| reviews:submit (peer review of a completed deal/referral) | ✓ |  |  |  | ✓ | ✓ |
| network:manage_all (dispute/oversight reserve — no UI consumes this yet) | ✓ | ✓ | ✓ |  |  |  |
| commissions:manage (reused, not duplicated, for commission-split create/approve/reject/pay) | ✓ |  |  | ✓ |  |  |

Ownership/ordering notes specific to Phase 3:
- **Connections** (`NetworkConnection`) use canonically ordered `brokerAId`/`brokerBId` (lower id first) so a broker pair has exactly one row regardless of who initiates; the separate `requesterId` field records the actual requester so recipient-only actions (accept/decline) and requester-only actions (cancel) can be told apart.
- **Messaging** is the only Phase 3 feature gated on a prior connection — referrals, collaboration invites, and listing shares can all be initiated with no connection, backed instead by per-action daily rate limits (`src/server/security/rate-limit.ts`).
- **`isInvolvedBroker()`** (`src/server/rbac/ownership.ts`) is the Phase 3 analogue to `ownsPartnerResource()` for resources owned by broker *identity* rather than partner membership (a deal-collaboration invite, a network connection) — "you are the invited/addressed party," optionally still admitting a broad permission like `deals:manage_all` or `network:manage_all`.
- **Commission splits** are finance/admin-only end to end (create, approve, reject, mark paid) — there is no broker-initiated "propose a split" flow. A holder of `commissions:manage` is still blocked from approving/rejecting/marking-paid a split that pays out to their own broker identity (self-dealing guard), for the dual-role case where a Finance Manager also holds a Broker profile.
- **Reviews** are immutable once submitted (no edit/delete endpoint) and gated to a *completed* context: a deal at the `CLOSED` stage, or a referral at `CONVERTED`/`CLOSED` — never an in-progress one.
