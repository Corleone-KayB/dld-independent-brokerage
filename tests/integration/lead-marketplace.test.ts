import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "@/server/db/client";
import { createLead, acceptMarketplaceLead } from "@/modules/leads/service";

describe("Lead Distribution Engine + Lead Marketplace integration (requires local Postgres + seed data)", () => {
  const createdLeadIds: string[] = [];
  const createdClientIds: string[] = [];

  afterAll(async () => {
    await prisma.lead.deleteMany({ where: { id: { in: createdLeadIds } } });
    await prisma.client.deleteMany({ where: { id: { in: createdClientIds } } });
    await prisma.$disconnect();
  });

  it("auto-scores a new lead and auto-assigns it to a matching broker on the same partner team", async () => {
    const brokerPartner = await prisma.partner.findFirstOrThrow({ where: { type: "INDEPENDENT_BROKER" } });
    const broker = await prisma.broker.findFirstOrThrow({ where: { partnerId: brokerPartner.id } });
    const client = await prisma.client.create({ data: { partnerId: brokerPartner.id, name: "Scoring Test Client", budget: 2000000 } });
    createdClientIds.push(client.id);

    const lead = await createLead(brokerPartner.id, {
      clientId: client.id,
      budget: 2000000,
      message: "Ready to buy this week, urgent, need this ASAP.",
      source: "WhatsApp",
    });
    createdLeadIds.push(lead.id);

    expect(lead.score).not.toBeNull();
    expect(lead.temperature).toBe("HOT");
    expect(lead.brokerId).toBe(broker.id);
  });

  it("leaves a lead unassigned when the partner has no verified brokers matching", async () => {
    const developerPartner = await prisma.partner.findFirstOrThrow({ where: { type: "DEVELOPER" } });
    const lead = await createLead(developerPartner.id, {});
    createdLeadIds.push(lead.id);

    expect(lead.brokerId).toBeNull();
  });

  it("transfers a marketplace lead's partner and broker on accept", async () => {
    const originatingPartner = await prisma.partner.findFirstOrThrow({ where: { type: "INDEPENDENT_BROKER" } });
    const lead = await prisma.lead.create({
      data: { partnerId: originatingPartner.id, visibility: "MARKETPLACE", status: "NEW", temperature: "WARM" },
    });
    createdLeadIds.push(lead.id);

    const acceptingBroker = await prisma.broker.findFirstOrThrow({
      where: { partnerId: { not: originatingPartner.id } },
    });

    const accepted = await acceptMarketplaceLead(lead.id, acceptingBroker.id);

    expect(accepted.brokerId).toBe(acceptingBroker.id);
    expect(accepted.partnerId).toBe(acceptingBroker.partnerId);
    expect(accepted.visibility).toBe("PRIVATE");
    expect(accepted.status).toBe("CONTACTED");
  });

  it("refuses to accept a lead that is not (or no longer) in the marketplace", async () => {
    const partner = await prisma.partner.findFirstOrThrow({ where: { type: "INDEPENDENT_BROKER" } });
    const broker = await prisma.broker.findFirstOrThrow();
    const lead = await prisma.lead.create({
      data: { partnerId: partner.id, visibility: "PRIVATE", status: "NEW", temperature: "WARM" },
    });
    createdLeadIds.push(lead.id);

    await expect(acceptMarketplaceLead(lead.id, broker.id)).rejects.toThrow();
  });
});
