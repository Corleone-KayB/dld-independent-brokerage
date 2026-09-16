import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/server/db/client";
import {
  listCollaborators,
  listMyCollaborations,
  inviteCollaborator,
  respondToCollaboration,
  removeCollaborator,
} from "@/modules/deal-collaboration/service";

/** Dedicated fixtures, isolated from other parallel test files (see FG3's lesson in PROJECT_STATE). */
async function makeFixtureBrokerWithPartner(tag: string) {
  const user = await prisma.user.create({ data: { email: `dealcollab-${tag}-${Date.now()}-${Math.random()}@test.local` } });
  const partner = await prisma.partner.create({ data: { type: "INDEPENDENT_BROKER", status: "APPROVED" } });
  const broker = await prisma.broker.create({
    data: {
      userId: user.id,
      partnerId: partner.id,
      slug: `dealcollab-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: `Fixture Broker ${tag}`,
      verificationStatus: "PLATFORM_VERIFIED",
    },
  });
  return { userId: user.id, partnerId: partner.id, broker };
}

describe("DLD Independent Brokerage Network — deal collaboration (requires local Postgres + seed data)", () => {
  let owner: Awaited<ReturnType<typeof makeFixtureBrokerWithPartner>>;
  let invitee: Awaited<ReturnType<typeof makeFixtureBrokerWithPartner>>;
  let deal: { id: string };
  const dealIds: string[] = [];

  beforeAll(async () => {
    owner = await makeFixtureBrokerWithPartner("owner");
    invitee = await makeFixtureBrokerWithPartner("invitee");
    deal = await prisma.deal.create({
      data: { partnerId: owner.partnerId, brokerId: owner.broker.id, stage: "VIEWING" },
    });
    dealIds.push(deal.id);
  });

  afterAll(async () => {
    await prisma.dealCollaborator.deleteMany({ where: { dealId: { in: dealIds } } });
    await prisma.deal.deleteMany({ where: { id: { in: dealIds } } });
    const brokerIds = [owner, invitee].map((x) => x.broker.id);
    const partnerIds = [owner, invitee].map((x) => x.partnerId);
    const userIds = [owner, invitee].map((x) => x.userId);
    await prisma.broker.deleteMany({ where: { id: { in: brokerIds } } });
    await prisma.partner.deleteMany({ where: { id: { in: partnerIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.$disconnect();
  });

  it("refuses to invite the deal's own broker as a collaborator", async () => {
    await expect(
      inviteCollaborator(deal.id, owner.userId, { brokerId: owner.broker.id, role: "CO_BROKER" }),
    ).rejects.toThrow(/already on the deal/i);
  });

  it("refuses to invite a broker that does not exist", async () => {
    await expect(
      inviteCollaborator(deal.id, owner.userId, { brokerId: "does-not-exist", role: "CO_BROKER" }),
    ).rejects.toThrow(/not found/i);
  });

  // The unique (dealId, brokerId) constraint means these tests share one collaborator row,
  // progressing its state INVITED -> ACCEPTED -> REMOVED, rather than each creating a fresh one.
  let collaboratorId: string;

  it("invites a collaborator and prevents a duplicate invite while it is still pending", async () => {
    const collaborator = await inviteCollaborator(deal.id, owner.userId, {
      brokerId: invitee.broker.id,
      role: "CO_BROKER",
      splitPercent: 15,
    });
    collaboratorId = collaborator.id;
    expect(collaborator.status).toBe("INVITED");
    expect(collaborator.splitPercent?.toString()).toBe("15");

    await expect(
      inviteCollaborator(deal.id, owner.userId, { brokerId: invitee.broker.id, role: "CO_BROKER" }),
    ).rejects.toThrow(/already on this deal/i);

    const collaborators = await listCollaborators(deal.id);
    expect(collaborators.some((c) => c.id === collaborator.id)).toBe(true);

    const invited = await listMyCollaborations(invitee.broker.id);
    expect(invited.some((c) => c.id === collaborator.id)).toBe(true);
  });

  it("only the invited broker can accept or decline, and only while pending", async () => {
    await expect(respondToCollaboration(collaboratorId, owner.broker.id, true)).rejects.toThrow(
      /only the invited broker/i,
    );

    const accepted = await respondToCollaboration(collaboratorId, invitee.broker.id, true);
    expect(accepted.status).toBe("ACCEPTED");

    await expect(respondToCollaboration(collaboratorId, invitee.broker.id, false)).rejects.toThrow(
      /no longer pending/i,
    );
  });

  it("removes a collaborator and refuses to remove one already removed", async () => {
    const removed = await removeCollaborator(collaboratorId);
    expect(removed.status).toBe("REMOVED");

    await expect(removeCollaborator(collaboratorId)).rejects.toThrow(/already been removed/i);
  });
});
