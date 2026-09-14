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

## Security
Every mutation:
- validates body
- authenticates
- authorizes
- applies resource scope
- writes audit event where required
