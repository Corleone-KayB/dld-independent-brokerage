import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/server/db/client";
import {
  createReferral,
  acceptReferral,
  declineReferral,
  cancelReferral,
  advanceReferralStatus,
  listMyReferrals,
} from "@/modules/referrals/service";
import { RateLimitError } from "@/server/security/rate-limit";

/** Dedicated fixture brokers+partners, isolated from other parallel test files (see FG3's lesson in PROJECT_STATE). */
async function makeFixtureBrokerWithPartner(tag: string) {
  const user = await prisma.user.create({ data: { email: `referral-${tag}-${Date.now()}-${Math.random()}@test.local` } });
  const partner = await prisma.partner.create({ data: { type: "INDEPENDENT_BROKER", status: "APPROVED" } });
  const broker = await prisma.broker.create({
    data: {
      userId: user.id,
      partnerId: partner.id,
      slug: `referral-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: `Fixture Broker ${tag}`,
      verificationStatus: "PLATFORM_VERIFIED",
    },
  });
  return { userId: user.id, partnerId: partner.id, broker };
}

describe("DLD Independent Brokerage Network — referrals & lead exchange (requires local Postgres + seed data)", () => {
  let a: Awaited<ReturnType<typeof makeFixtureBrokerWithPartner>>;
  let b: Awaited<ReturnType<typeof makeFixtureBrokerWithPartner>>;
  let c: Awaited<ReturnType<typeof makeFixtureBrokerWithPartner>>;
  let d: Awaited<ReturnType<typeof makeFixtureBrokerWithPartner>>;
  const referralIds: string[] = [];
  const leadIds: string[] = [];
  const clientIds: string[] = [];

  beforeAll(async () => {
    a = await makeFixtureBrokerWithPartner("a");
    b = await makeFixtureBrokerWithPartner("b");
    c = await makeFixtureBrokerWithPartner("c");
    d = await makeFixtureBrokerWithPartner("d");
  });

  afterAll(async () => {
    await prisma.referral.deleteMany({ where: { id: { in: referralIds } } });
    await prisma.lead.deleteMany({ where: { id: { in: leadIds } } });
    await prisma.client.deleteMany({ where: { id: { in: clientIds } } });
    const brokerIds = [a, b, c, d].map((x) => x.broker.id);
    const partnerIds = [a, b, c, d].map((x) => x.partnerId);
    const userIds = [a, b, c, d].map((x) => x.userId);
    await prisma.broker.deleteMany({ where: { id: { in: brokerIds } } });
    await prisma.partner.deleteMany({ where: { id: { in: partnerIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.$disconnect();
  });

  it("refuses a self-referral", async () => {
    await expect(
      createReferral(a.broker.id, { receivingBrokerId: a.broker.id, clientSnapshotName: "Test" }),
    ).rejects.toThrow(/yourself/i);
  });

  it("refuses a referral to a broker that does not exist", async () => {
    await expect(
      createReferral(a.broker.id, { receivingBrokerId: "does-not-exist", clientSnapshotName: "Test" }),
    ).rejects.toThrow(/not found/i);
  });

  it("creates a SENT referral carrying the proposed (not yet locked) split", async () => {
    const referral = await createReferral(a.broker.id, {
      receivingBrokerId: b.broker.id,
      clientSnapshotName: "Sara Investor",
      clientSnapshotBudget: 1500000,
      requirementNotes: "Looking for a 2BR in Business Bay",
      proposedSplitPercent: 25,
    });
    referralIds.push(referral.id);

    expect(referral.status).toBe("SENT");
    expect(referral.proposedSplitPercent?.toString()).toBe("25");
    expect(referral.acceptedSplitPercent).toBeNull();
    expect(referral.acceptedAt).toBeNull();

    const { sent } = await listMyReferrals(a.broker.id);
    expect(sent.some((r) => r.id === referral.id)).toBe(true);
    const { received } = await listMyReferrals(b.broker.id);
    expect(received.some((r) => r.id === referral.id)).toBe(true);
  });

  it("only the receiving broker can accept, locking the proposed split as the accepted split and creating a working lead", async () => {
    const referral = await prisma.referral.create({
      data: {
        referringBrokerId: a.broker.id,
        referringPartnerId: a.partnerId,
        receivingBrokerId: b.broker.id,
        receivingPartnerId: b.partnerId,
        clientSnapshotName: "Omar Buyer",
        clientSnapshotBudget: 2000000,
        proposedSplitPercent: 30,
        status: "SENT",
      },
    });
    referralIds.push(referral.id);

    await expect(acceptReferral(referral.id, a.broker.id, a.userId)).rejects.toThrow(/only the receiving broker/i);

    const accepted = await acceptReferral(referral.id, b.broker.id, b.userId);
    expect(accepted.status).toBe("ACCEPTED");
    expect(accepted.acceptedSplitPercent?.toString()).toBe("30");
    expect(accepted.acceptedByUserId).toBe(b.userId);
    expect(accepted.resultingLeadId).not.toBeNull();

    const lead = await prisma.lead.findUniqueOrThrow({ where: { id: accepted.resultingLeadId! } });
    leadIds.push(lead.id);
    if (lead.clientId) clientIds.push(lead.clientId);
    expect(lead.partnerId).toBe(b.partnerId);
    expect(lead.brokerId).toBe(b.broker.id);
    expect(lead.score).not.toBeNull();

    await expect(acceptReferral(referral.id, b.broker.id, b.userId)).rejects.toThrow(/no longer pending/i);
  });

  it("only the receiving broker can decline, recording the reason", async () => {
    const referral = await prisma.referral.create({
      data: {
        referringBrokerId: a.broker.id,
        referringPartnerId: a.partnerId,
        receivingBrokerId: b.broker.id,
        receivingPartnerId: b.partnerId,
        clientSnapshotName: "Layla Renter",
        status: "SENT",
      },
    });
    referralIds.push(referral.id);

    await expect(declineReferral(referral.id, a.broker.id, "not my area")).rejects.toThrow(/only the receiving broker/i);

    const declined = await declineReferral(referral.id, b.broker.id, "Outside my coverage area");
    expect(declined.status).toBe("DECLINED");
    expect(declined.declineReason).toBe("Outside my coverage area");
  });

  it("only the referring broker can cancel a pending referral", async () => {
    const referral = await prisma.referral.create({
      data: {
        referringBrokerId: a.broker.id,
        referringPartnerId: a.partnerId,
        receivingBrokerId: b.broker.id,
        receivingPartnerId: b.partnerId,
        clientSnapshotName: "Fahad Tenant",
        status: "SENT",
      },
    });
    referralIds.push(referral.id);

    await expect(cancelReferral(referral.id, b.broker.id)).rejects.toThrow(/only the referring broker/i);

    const cancelled = await cancelReferral(referral.id, a.broker.id);
    expect(cancelled.status).toBe("CANCELLED");
  });

  it("advances an accepted referral through IN_PROGRESS to CONVERTED, but rejects invalid transitions", async () => {
    const stillSent = await prisma.referral.create({
      data: {
        referringBrokerId: a.broker.id,
        referringPartnerId: a.partnerId,
        receivingBrokerId: b.broker.id,
        receivingPartnerId: b.partnerId,
        clientSnapshotName: "Not Yet Accepted",
        status: "SENT",
      },
    });
    referralIds.push(stillSent.id);
    await expect(advanceReferralStatus(stillSent.id, b.broker.id, "CONVERTED")).rejects.toThrow(/cannot move/i);

    const accepted = await prisma.referral.create({
      data: {
        referringBrokerId: a.broker.id,
        referringPartnerId: a.partnerId,
        receivingBrokerId: b.broker.id,
        receivingPartnerId: b.partnerId,
        clientSnapshotName: "Progressing Client",
        status: "ACCEPTED",
        acceptedSplitPercent: 20,
        acceptedAt: new Date(),
        acceptedByUserId: b.userId,
      },
    });
    referralIds.push(accepted.id);

    await expect(advanceReferralStatus(accepted.id, a.broker.id, "IN_PROGRESS")).rejects.toThrow(
      /only the receiving broker/i,
    );

    const inProgress = await advanceReferralStatus(accepted.id, b.broker.id, "IN_PROGRESS");
    expect(inProgress.status).toBe("IN_PROGRESS");

    const converted = await advanceReferralStatus(accepted.id, b.broker.id, "CONVERTED", "deal-123");
    expect(converted.status).toBe("CONVERTED");
    expect(converted.resultingDealId).toBe("deal-123");
  });

  it("enforces the per-day, per-target-broker referral rate limit", async () => {
    for (let i = 0; i < 5; i++) {
      const referral = await createReferral(c.broker.id, {
        receivingBrokerId: d.broker.id,
        clientSnapshotName: `Rate Limit Client ${i}`,
      });
      referralIds.push(referral.id);
    }

    await expect(
      createReferral(c.broker.id, { receivingBrokerId: d.broker.id, clientSnapshotName: "One too many" }),
    ).rejects.toThrow(RateLimitError);
  });
});
