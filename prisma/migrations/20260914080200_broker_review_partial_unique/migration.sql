-- One review per reviewer per completed context (a deal OR a referral).
-- Prisma's schema DSL can't express a conditional/partial unique constraint,
-- so this is hand-written, same technique used in
-- 20260914060000_developer_slug during Phase 2. Two partial unique indexes
-- (rather than one compound unique on both nullable columns) because a
-- review is tied to exactly one context — either dealId or referralId is
-- set, never both, never neither (enforced in application code).
CREATE UNIQUE INDEX "BrokerReview_reviewer_deal_unique"
  ON "BrokerReview" ("reviewerBrokerId", "dealId")
  WHERE "dealId" IS NOT NULL;

CREATE UNIQUE INDEX "BrokerReview_reviewer_referral_unique"
  ON "BrokerReview" ("reviewerBrokerId", "referralId")
  WHERE "referralId" IS NOT NULL;
