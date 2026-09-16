import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/server/db/client";
import { getNetworkActivity } from "@/server/analytics/broker-performance";

/** Dedicated fixtures, isolated from other parallel test files (see FG3's lesson in PROJECT_STATE). */
async function makeFixtureBrokerWithPartner(tag: string) {
  const user = await prisma.user.create({ data: { email: `netperf-${tag}-${Date.now()}-${Math.random()}@test.local` } });
  const partner = await prisma.partner.create({ data: { type: "INDEPENDENT_BROKER", status: "APPROVED" } });
  const broker = await prisma.broker.create({
    data: {
      userId: user.id,
      partnerId: partner.id,
      slug: `netperf-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: `Fixture Broker ${tag}`,
      verificationStatus: "PLATFORM_VERIFIED",
    },
  });
  return { userId: user.id, partnerId: partner.id, broker };
}

describe("Phase 3 network activity metrics (requires local Postgres + seed data)", () => {
  let a: Awaited<ReturnType<typeof makeFixtureBrokerWithPartner>>;
  let b: Awaited<ReturnType<typeof makeFixtureBrokerWithPartner>>;
  let deal: { id: string };
  let referral: { id: string };
  let property: { id: string };

  beforeAll(async () => {
    a = await makeFixtureBrokerWithPartner("a");
    b = await makeFixtureBrokerWithPartner("b");

    const [brokerAId, brokerBId] = [a.broker.id, b.broker.id].sort() as [string, string];
    await prisma.networkConnection.create({
      data: { brokerAId, brokerBId, requesterId: a.broker.id, status: "ACCEPTED" },
    });

    referral = await prisma.referral.create({
      data: {
        referringBrokerId: a.broker.id,
        referringPartnerId: a.partnerId,
        receivingBrokerId: b.broker.id,
        receivingPartnerId: b.partnerId,
        clientSnapshotName: "Perf Test Client",
        status: "CONVERTED",
      },
    });

    deal = await prisma.deal.create({ data: { partnerId: a.partnerId, brokerId: a.broker.id, stage: "CLOSED" } });
    await prisma.dealCollaborator.create({
      data: { dealId: deal.id, brokerId: b.broker.id, role: "CO_BROKER", status: "ACCEPTED" },
    });

    property = await prisma.property.create({
      data: {
        slug: `netperf-listing-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title: "Perf Test Listing",
        purpose: "BUY",
        propertyType: "APARTMENT",
        price: 500000,
        partnerId: a.partnerId,
        brokerId: a.broker.id,
        status: "PUBLISHED",
      },
    });
    await prisma.propertyShare.create({
      data: { propertyId: property.id, sharingBrokerId: a.broker.id, sharedWithBrokerId: b.broker.id, status: "ACTIVE" },
    });

    await prisma.brokerReview.create({
      data: {
        reviewerBrokerId: b.broker.id,
        revieweeBrokerId: a.broker.id,
        dealId: deal.id,
        rating: 5,
      },
    });
    await prisma.broker.update({ where: { id: a.broker.id }, data: { rating: 5 } });
  });

  afterAll(async () => {
    await prisma.brokerReview.deleteMany({ where: { dealId: deal.id } });
    await prisma.propertyShare.deleteMany({ where: { propertyId: property.id } });
    await prisma.property.delete({ where: { id: property.id } });
    await prisma.dealCollaborator.deleteMany({ where: { dealId: deal.id } });
    await prisma.deal.delete({ where: { id: deal.id } });
    await prisma.referral.delete({ where: { id: referral.id } });
    await prisma.networkConnection.deleteMany({
      where: { OR: [{ brokerAId: a.broker.id }, { brokerBId: a.broker.id }] },
    });
    const brokerIds = [a, b].map((x) => x.broker.id);
    const partnerIds = [a, b].map((x) => x.partnerId);
    const userIds = [a, b].map((x) => x.userId);
    await prisma.broker.deleteMany({ where: { id: { in: brokerIds } } });
    await prisma.partner.deleteMany({ where: { id: { in: partnerIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.$disconnect();
  });

  it("counts every kind of Phase 3 network activity for a broker who was the initiator/owner", async () => {
    const activity = await getNetworkActivity(a.broker.id);
    expect(activity.activeConnections).toBe(1);
    expect(activity.referralsCompleted).toBe(1);
    expect(activity.dealCollaborations).toBe(0); // a owns the deal, b is the accepted collaborator
    expect(activity.listingsShared).toBe(1);
    expect(activity.reviewCount).toBe(1);
    expect(activity.rating).toBe(5);
  });

  it("counts activity correctly from the other broker's perspective too", async () => {
    const activity = await getNetworkActivity(b.broker.id);
    expect(activity.activeConnections).toBe(1);
    expect(activity.referralsCompleted).toBe(1);
    expect(activity.dealCollaborations).toBe(1); // b is the accepted collaborator on a's deal
    expect(activity.listingsShared).toBe(0); // b received the share, didn't grant one
    expect(activity.reviewCount).toBe(0); // b hasn't received any reviews
  });
});
