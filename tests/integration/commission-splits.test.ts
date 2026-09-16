import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/server/db/client";
import {
  createSplit,
  approveSplit,
  rejectSplit,
  markSplitPaid,
  listSplitsForCommission,
  listMySplits,
} from "@/modules/commission-splits/service";

/** Dedicated fixtures, isolated from other parallel test files (see FG3's lesson in PROJECT_STATE). */
async function makeFixtureBrokerWithPartner(tag: string) {
  const user = await prisma.user.create({ data: { email: `commsplit-${tag}-${Date.now()}-${Math.random()}@test.local` } });
  const partner = await prisma.partner.create({ data: { type: "INDEPENDENT_BROKER", status: "APPROVED" } });
  const broker = await prisma.broker.create({
    data: {
      userId: user.id,
      partnerId: partner.id,
      slug: `commsplit-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: `Fixture Broker ${tag}`,
      verificationStatus: "PLATFORM_VERIFIED",
    },
  });
  return { userId: user.id, partnerId: partner.id, broker };
}

describe("DLD Independent Brokerage Network — commission splitting (requires local Postgres + seed data)", () => {
  let owner: Awaited<ReturnType<typeof makeFixtureBrokerWithPartner>>;
  let beneficiary: Awaited<ReturnType<typeof makeFixtureBrokerWithPartner>>;
  let financeUser: { id: string };
  let deal: { id: string };
  let commission: { id: string; amount: unknown };

  beforeAll(async () => {
    owner = await makeFixtureBrokerWithPartner("owner");
    beneficiary = await makeFixtureBrokerWithPartner("beneficiary");
    financeUser = await prisma.user.create({ data: { email: `commsplit-finance-${Date.now()}@test.local` } });

    deal = await prisma.deal.create({
      data: { partnerId: owner.partnerId, brokerId: owner.broker.id, stage: "COMMISSION", value: 1000000 },
    });
    commission = await prisma.commission.create({
      data: { dealId: deal.id, partnerId: owner.partnerId, brokerId: owner.broker.id, amount: 20000, status: "PENDING" },
    });
  });

  afterAll(async () => {
    await prisma.commissionSplit.deleteMany({ where: { commissionId: commission.id } });
    await prisma.commission.delete({ where: { id: commission.id } });
    await prisma.deal.delete({ where: { id: deal.id } });
    const brokerIds = [owner, beneficiary].map((x) => x.broker.id);
    const partnerIds = [owner, beneficiary].map((x) => x.partnerId);
    const userIds = [owner.userId, beneficiary.userId, financeUser.id];
    await prisma.broker.deleteMany({ where: { id: { in: brokerIds } } });
    await prisma.partner.deleteMany({ where: { id: { in: partnerIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.$disconnect();
  });

  it("rejects an out-of-range percent", async () => {
    await expect(createSplit(commission.id, { brokerId: beneficiary.broker.id, percent: 0 })).rejects.toThrow(
      /greater than 0/i,
    );
    await expect(createSplit(commission.id, { brokerId: beneficiary.broker.id, percent: 101 })).rejects.toThrow(
      /at most 100/i,
    );
  });

  it("rejects a split for a broker that does not exist", async () => {
    await expect(createSplit(commission.id, { brokerId: "does-not-exist", percent: 10 })).rejects.toThrow(
      /not found/i,
    );
  });

  let splitId: string;

  it("creates a PENDING split with the amount computed from the commission total", async () => {
    const split = await createSplit(commission.id, { brokerId: beneficiary.broker.id, percent: 20 });
    splitId = split.id;
    expect(split.status).toBe("PENDING");
    expect(split.percent.toString()).toBe("20");
    expect(Number(split.amount)).toBeCloseTo(4000, 2); // 20% of 20,000

    const splits = await listSplitsForCommission(commission.id);
    expect(splits.some((s) => s.id === split.id)).toBe(true);

    const mine = await listMySplits(beneficiary.broker.id);
    expect(mine.some((s) => s.id === split.id)).toBe(true);
  });

  it("refuses to over-allocate beyond the remaining unallocated percent", async () => {
    await expect(
      createSplit(commission.id, { brokerId: owner.broker.id, percent: 81 }),
    ).rejects.toThrow(/only 80.00% remains/i);

    const ok = await createSplit(commission.id, { brokerId: owner.broker.id, percent: 80 });
    expect(ok.status).toBe("PENDING");
    // Clean up this second split so later tests reason about a single pending split again.
    await prisma.commissionSplit.delete({ where: { id: ok.id } });
  });

  it("forbids a holder of COMMISSIONS_MANAGE from approving a split that pays out to their own broker identity", async () => {
    await expect(approveSplit(splitId, financeUser.id, beneficiary.broker.id)).rejects.toThrow(
      /cannot approve, reject, or mark paid/i,
    );
  });

  it("approves a pending split, recording who approved it and when", async () => {
    const approved = await approveSplit(splitId, financeUser.id, null);
    expect(approved.status).toBe("APPROVED");
    expect(approved.approvedByUserId).toBe(financeUser.id);
    expect(approved.approvedAt).not.toBeNull();

    await expect(approveSplit(splitId, financeUser.id, null)).rejects.toThrow(/no longer pending/i);
  });

  it("marks an approved split as paid, but refuses to pay one that isn't approved", async () => {
    const otherSplit = await createSplit(commission.id, { brokerId: owner.broker.id, percent: 5 });
    await expect(markSplitPaid(otherSplit.id, null)).rejects.toThrow(/only an approved split/i);

    const paid = await markSplitPaid(splitId, null);
    expect(paid.status).toBe("PAID");
    expect(paid.paidAt).not.toBeNull();

    await prisma.commissionSplit.delete({ where: { id: otherSplit.id } });
  });

  it("rejects a pending split with a reason, and a rejected split's percent no longer counts against the allocation cap", async () => {
    const toReject = await createSplit(commission.id, { brokerId: owner.broker.id, percent: 10 });
    const rejected = await rejectSplit(toReject.id, financeUser.id, null, "Not part of the agreed team");
    expect(rejected.status).toBe("REJECTED");
    expect(rejected.rejectionReason).toBe("Not part of the agreed team");

    // 20% (paid) is the only non-rejected split now, so up to 80% should still be allocatable.
    const reallocated = await createSplit(commission.id, { brokerId: owner.broker.id, percent: 80 });
    expect(reallocated.status).toBe("PENDING");
    await prisma.commissionSplit.delete({ where: { id: reallocated.id } });
  });
});
