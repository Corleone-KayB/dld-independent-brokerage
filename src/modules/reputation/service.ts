import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";

type Tx = Prisma.TransactionClient;

export interface ReviewCreateInput {
  revieweeBrokerId: string;
  dealId?: string;
  referralId?: string;
  rating: number;
  comment?: string;
}

/**
 * Peer-only reputation (decision 2): reviews are gated to a *completed*
 * collaboration — a deal at the CLOSED stage (the actual terminal state;
 * COMMISSION only marks when commission tracking begins per Phase 2's
 * broker-performance.ts, the deal can still progress or be CANCELLED after
 * that) — or a referral that reached CONVERTED/CLOSED. No client-facing
 * reviews exist.
 */
async function assertDealEligibility(
  tx: Tx,
  dealId: string,
  reviewerBrokerId: string,
  revieweeBrokerId: string,
) {
  const deal = await tx.deal.findUnique({
    where: { id: dealId },
    include: { collaborators: { where: { status: "ACCEPTED" } } },
  });
  if (!deal) throw new Error("Deal not found");
  if (deal.stage !== "CLOSED") {
    throw new Error("You can only review a collaboration once the deal is closed");
  }

  const involved = new Set(
    [deal.brokerId, ...deal.collaborators.map((c) => c.brokerId)].filter((id): id is string => !!id),
  );
  if (!involved.has(reviewerBrokerId)) throw new Error("You were not involved in this deal");
  if (!involved.has(revieweeBrokerId)) throw new Error("That broker was not involved in this deal");
}

async function assertReferralEligibility(
  tx: Tx,
  referralId: string,
  reviewerBrokerId: string,
  revieweeBrokerId: string,
) {
  const referral = await tx.referral.findUnique({ where: { id: referralId } });
  if (!referral) throw new Error("Referral not found");
  if (referral.status !== "CONVERTED" && referral.status !== "CLOSED") {
    throw new Error("You can only review a referral that has converted or closed");
  }

  const pair = new Set([referral.referringBrokerId, referral.receivingBrokerId]);
  if (!pair.has(reviewerBrokerId) || !pair.has(revieweeBrokerId)) {
    throw new Error("You were not part of this referral");
  }
}

async function recomputeRating(tx: Tx, brokerId: string) {
  const agg = await tx.brokerReview.aggregate({ where: { revieweeBrokerId: brokerId }, _avg: { rating: true } });
  await tx.broker.update({ where: { id: brokerId }, data: { rating: agg._avg.rating } });
}

export async function createReview(reviewerBrokerId: string, input: ReviewCreateInput) {
  if (reviewerBrokerId === input.revieweeBrokerId) {
    throw new Error("You cannot review yourself");
  }

  return prisma.$transaction(async (tx) => {
    if (input.dealId) {
      await assertDealEligibility(tx, input.dealId, reviewerBrokerId, input.revieweeBrokerId);
      const existing = await tx.brokerReview.findFirst({
        where: { reviewerBrokerId, dealId: input.dealId },
      });
      if (existing) throw new Error("You have already reviewed this collaboration");
    } else {
      await assertReferralEligibility(tx, input.referralId!, reviewerBrokerId, input.revieweeBrokerId);
      const existing = await tx.brokerReview.findFirst({
        where: { reviewerBrokerId, referralId: input.referralId },
      });
      if (existing) throw new Error("You have already reviewed this referral");
    }

    const review = await tx.brokerReview.create({
      data: {
        reviewerBrokerId,
        revieweeBrokerId: input.revieweeBrokerId,
        dealId: input.dealId ?? null,
        referralId: input.referralId ?? null,
        rating: input.rating,
        comment: input.comment,
      },
    });

    await recomputeRating(tx, input.revieweeBrokerId);

    return review;
  });
}

export async function listReviewsForBroker(brokerId: string) {
  return prisma.brokerReview.findMany({
    where: { revieweeBrokerId: brokerId },
    include: { reviewer: true },
    orderBy: { createdAt: "desc" },
  });
}

export interface ReviewableItem {
  contextType: "DEAL" | "REFERRAL";
  dealId?: string;
  referralId?: string;
  label: string;
  otherBrokerId: string;
  otherBrokerName: string;
}

/** Completed deals/referrals this broker hasn't yet reviewed the other side for. */
export async function listReviewableForBroker(brokerId: string): Promise<ReviewableItem[]> {
  const [deals, referrals, myReviews] = await Promise.all([
    prisma.deal.findMany({
      where: {
        stage: "CLOSED",
        OR: [{ brokerId }, { collaborators: { some: { brokerId, status: "ACCEPTED" } } }],
      },
      include: {
        collaborators: { where: { status: "ACCEPTED" }, include: { broker: true } },
        broker: true,
        property: true,
      },
    }),
    prisma.referral.findMany({
      where: {
        status: { in: ["CONVERTED", "CLOSED"] },
        OR: [{ referringBrokerId: brokerId }, { receivingBrokerId: brokerId }],
      },
      include: { referringBroker: true, receivingBroker: true },
    }),
    prisma.brokerReview.findMany({ where: { reviewerBrokerId: brokerId } }),
  ]);

  const reviewedDealIds = new Set(myReviews.filter((r) => r.dealId).map((r) => r.dealId));
  const reviewedReferralIds = new Set(myReviews.filter((r) => r.referralId).map((r) => r.referralId));

  const dealItems: ReviewableItem[] = deals
    .filter((deal) => !reviewedDealIds.has(deal.id))
    .flatMap((deal) => {
      const others = new Map<string, string>();
      if (deal.broker && deal.broker.id !== brokerId) others.set(deal.broker.id, deal.broker.name);
      for (const c of deal.collaborators) {
        if (c.brokerId !== brokerId) others.set(c.brokerId, c.broker.name);
      }
      return [...others.entries()].map(([otherBrokerId, otherBrokerName]) => ({
        contextType: "DEAL" as const,
        dealId: deal.id,
        label: deal.property?.title ?? "Deal",
        otherBrokerId,
        otherBrokerName,
      }));
    });

  const referralItems: ReviewableItem[] = referrals
    .filter((r) => !reviewedReferralIds.has(r.id))
    .map((r) => {
      const isReferrer = r.referringBrokerId === brokerId;
      const other = isReferrer ? r.receivingBroker : r.referringBroker;
      return {
        contextType: "REFERRAL" as const,
        referralId: r.id,
        label: r.clientSnapshotName ?? "Referral",
        otherBrokerId: other.id,
        otherBrokerName: other.name,
      };
    });

  return [...dealItems, ...referralItems];
}
