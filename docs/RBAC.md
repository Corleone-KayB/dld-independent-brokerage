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
