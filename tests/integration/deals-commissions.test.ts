import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "@/server/db/client";
import { createDeal, updateDealStage } from "@/modules/deals/service";
import { COMMISSION_DEFAULT_RATE } from "@/lib/constants";

describe("Deal Management + Commission Management integration (requires local Postgres + seed data)", () => {
  const createdDealIds: string[] = [];

  afterAll(async () => {
    await prisma.commission.deleteMany({ where: { dealId: { in: createdDealIds } } });
    await prisma.deal.deleteMany({ where: { id: { in: createdDealIds } } });
    await prisma.$disconnect();
  });

  it("creates a deal at the VIEWING stage with no commission yet", async () => {
    const brokerPartner = await prisma.partner.findFirstOrThrow({ where: { type: "INDEPENDENT_BROKER" } });
    const deal = await createDeal(brokerPartner.id, { value: 1000000 });
    createdDealIds.push(deal.id);

    expect(deal.stage).toBe("VIEWING");
    const commission = await prisma.commission.findUnique({ where: { dealId: deal.id } });
    expect(commission).toBeNull();
  });

  it("auto-creates a commission at the default rate when a deal reaches the COMMISSION stage", async () => {
    const brokerPartner = await prisma.partner.findFirstOrThrow({ where: { type: "INDEPENDENT_BROKER" } });
    const deal = await createDeal(brokerPartner.id, { value: 2000000 });
    createdDealIds.push(deal.id);

    const updated = await updateDealStage(deal.id, { stage: "COMMISSION" });

    expect(updated.stage).toBe("COMMISSION");
    expect(updated.commission).not.toBeNull();
    expect(Number(updated.commission!.amount)).toBeCloseTo(2000000 * COMMISSION_DEFAULT_RATE);
    expect(updated.commission!.status).toBe("PENDING");
  });

  it("does not create a duplicate commission if the deal cycles through COMMISSION again", async () => {
    const brokerPartner = await prisma.partner.findFirstOrThrow({ where: { type: "INDEPENDENT_BROKER" } });
    const deal = await createDeal(brokerPartner.id, { value: 500000 });
    createdDealIds.push(deal.id);

    await updateDealStage(deal.id, { stage: "COMMISSION" });
    await updateDealStage(deal.id, { stage: "CLOSED" });
    const final = await updateDealStage(deal.id, { stage: "COMMISSION" });

    const commissions = await prisma.commission.findMany({ where: { dealId: deal.id } });
    expect(commissions).toHaveLength(1);
    expect(final.commission?.id).toBe(commissions[0]?.id);
  });

  it("does not auto-create a commission if the deal has no value set", async () => {
    const brokerPartner = await prisma.partner.findFirstOrThrow({ where: { type: "INDEPENDENT_BROKER" } });
    const deal = await createDeal(brokerPartner.id, {});
    createdDealIds.push(deal.id);

    const updated = await updateDealStage(deal.id, { stage: "COMMISSION" });
    expect(updated.commission).toBeNull();
  });
});
