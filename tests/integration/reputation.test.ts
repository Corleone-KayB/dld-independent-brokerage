import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/server/db/client";
import { createReview, listReviewableForBroker, listReviewsForBroker } from "@/modules/reputation/service";

/** Dedicated fixtures, isolated from other parallel test files (see FG3's lesson in PROJECT_STATE). */
async function makeFixtureBrokerWithPartner(tag: string) {
  const user = await prisma.user.create({ data: { email: `reputation-${tag}-${Date.now()}-${Math.random()}@test.local` } });
  const partner = await prisma.partner.create({ data: { type: "INDEPENDENT_BROKER", status: "APPROVED" } });
  const broker = await prisma.broker.create({
    data: {
      userId: user.id,
      partnerId: partner.id,
      slug: `reputation-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: `Fixture Broker ${tag}`,
      verificationStatus: "PLATFORM_VERIFIED",
    },
  });
  return { userId: user.id, partnerId: partner.id, broker };
}

describe("DLD Independent Brokerage Network — reputation / peer reviews (requires local Postgres + seed data)", () => {
  let a: Awaited<ReturnType<typeof makeFixtureBrokerWithPartner>>;
  let b: Awaited<ReturnType<typeof makeFixtureBrokerWithPartner>>;
  let stranger: Awaited<ReturnType<typeof makeFixtureBrokerWithPartner>>;
  let openDeal: { id: string };
  let closedDeal: { id: string };
  let convertedReferral: { id: string };
  const reviewIds: string[] = [];

  beforeAll(async () => {
    a = await makeFixtureBrokerWithPartner("a");
    b = await makeFixtureBrokerWithPartner("b");
    stranger = await makeFixtureBrokerWithPartner("stranger");

    openDeal = await prisma.deal.create({ data: { partnerId: a.partnerId, brokerId: a.broker.id, stage: "VIEWING" } });
    closedDeal = await prisma.deal.create({ data: { partnerId: a.partnerId, brokerId: a.broker.id, stage: "CLOSED" } });
    await prisma.dealCollaborator.create({
      data: { dealId: closedDeal.id, brokerId: b.broker.id, role: "CO_BROKER", status: "ACCEPTED" },
    });

    convertedReferral = await prisma.referral.create({
      data: {
        referringBrokerId: a.broker.id,
        referringPartnerId: a.partnerId,
        receivingBrokerId: b.broker.id,
        receivingPartnerId: b.partnerId,
        clientSnapshotName: "Converted Client",
        status: "CONVERTED",
      },
    });
  });

  afterAll(async () => {
    await prisma.brokerReview.deleteMany({ where: { id: { in: reviewIds } } });
    await prisma.referral.delete({ where: { id: convertedReferral.id } });
    await prisma.dealCollaborator.deleteMany({ where: { dealId: closedDeal.id } });
    await prisma.deal.deleteMany({ where: { id: { in: [openDeal.id, closedDeal.id] } } });
    const brokerIds = [a, b, stranger].map((x) => x.broker.id);
    const partnerIds = [a, b, stranger].map((x) => x.partnerId);
    const userIds = [a, b, stranger].map((x) => x.userId);
    await prisma.broker.deleteMany({ where: { id: { in: brokerIds } } });
    await prisma.partner.deleteMany({ where: { id: { in: partnerIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.$disconnect();
  });

  it("refuses to review yourself", async () => {
    await expect(createReview(a.broker.id, { revieweeBrokerId: a.broker.id, dealId: closedDeal.id, rating: 5 })).rejects.toThrow(
      /yourself/i,
    );
  });

  it("refuses a deal review before the deal is closed", async () => {
    await expect(
      createReview(a.broker.id, { revieweeBrokerId: b.broker.id, dealId: openDeal.id, rating: 5 }),
    ).rejects.toThrow(/closed/i);
  });

  it("refuses a deal review when either party was not actually involved", async () => {
    await expect(
      createReview(stranger.broker.id, { revieweeBrokerId: b.broker.id, dealId: closedDeal.id, rating: 5 }),
    ).rejects.toThrow(/not involved/i);
    await expect(
      createReview(a.broker.id, { revieweeBrokerId: stranger.broker.id, dealId: closedDeal.id, rating: 5 }),
    ).rejects.toThrow(/not involved/i);
  });

  it("creates a review once the deal collaboration is complete, recomputes the reviewee's rating, and blocks a duplicate", async () => {
    const review = await createReview(a.broker.id, {
      revieweeBrokerId: b.broker.id,
      dealId: closedDeal.id,
      rating: 4,
      comment: "Great to work with.",
    });
    reviewIds.push(review.id);
    expect(review.rating).toBe(4);

    const updatedBroker = await prisma.broker.findUniqueOrThrow({ where: { id: b.broker.id } });
    expect(updatedBroker.rating).toBeCloseTo(4, 5);

    await expect(
      createReview(a.broker.id, { revieweeBrokerId: b.broker.id, dealId: closedDeal.id, rating: 3 }),
    ).rejects.toThrow(/already reviewed/i);
  });

  it("refuses a referral review before it has converted or closed, and to anyone outside the referral", async () => {
    const pendingReferral = await prisma.referral.create({
      data: {
        referringBrokerId: a.broker.id,
        referringPartnerId: a.partnerId,
        receivingBrokerId: b.broker.id,
        receivingPartnerId: b.partnerId,
        clientSnapshotName: "Still Pending",
        status: "SENT",
      },
    });

    await expect(
      createReview(a.broker.id, { revieweeBrokerId: b.broker.id, referralId: pendingReferral.id, rating: 5 }),
    ).rejects.toThrow(/converted or closed/i);

    await expect(
      createReview(stranger.broker.id, { revieweeBrokerId: b.broker.id, referralId: convertedReferral.id, rating: 5 }),
    ).rejects.toThrow(/not part of this referral/i);

    await prisma.referral.delete({ where: { id: pendingReferral.id } });
  });

  it("creates a review for a converted referral, averaging into the existing rating", async () => {
    const review = await createReview(b.broker.id, {
      revieweeBrokerId: a.broker.id,
      referralId: convertedReferral.id,
      rating: 5,
    });
    reviewIds.push(review.id);

    const received = await listReviewsForBroker(a.broker.id);
    expect(received.some((r) => r.id === review.id)).toBe(true);
  });

  it("excludes already-reviewed contexts from the reviewable list", async () => {
    const reviewableForA = await listReviewableForBroker(a.broker.id);
    expect(reviewableForA.some((item) => item.dealId === closedDeal.id)).toBe(false);
  });
});
