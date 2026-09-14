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
