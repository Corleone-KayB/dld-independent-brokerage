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
