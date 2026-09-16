import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/server/db/client";
import { shareProperty, revokeShare, listSharesForProperty, listSharedWithMe } from "@/modules/property-sharing/service";

/** Dedicated fixtures, isolated from other parallel test files (see FG3's lesson in PROJECT_STATE). */
async function makeFixtureBrokerWithPartner(tag: string) {
  const user = await prisma.user.create({ data: { email: `propshare-${tag}-${Date.now()}-${Math.random()}@test.local` } });
  const partner = await prisma.partner.create({ data: { type: "INDEPENDENT_BROKER", status: "APPROVED" } });
  const broker = await prisma.broker.create({
    data: {
      userId: user.id,
      partnerId: partner.id,
      slug: `propshare-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: `Fixture Broker ${tag}`,
      verificationStatus: "PLATFORM_VERIFIED",
    },
  });
  return { userId: user.id, partnerId: partner.id, broker };
}

describe("DLD Independent Brokerage Network — listing sharing (requires local Postgres + seed data)", () => {
  let sharer: Awaited<ReturnType<typeof makeFixtureBrokerWithPartner>>;
  let recipient: Awaited<ReturnType<typeof makeFixtureBrokerWithPartner>>;
  let property: { id: string };

  beforeAll(async () => {
    sharer = await makeFixtureBrokerWithPartner("sharer");
    recipient = await makeFixtureBrokerWithPartner("recipient");
    property = await prisma.property.create({
      data: {
        slug: `propshare-listing-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title: "Test Sharing Property",
        purpose: "BUY",
        propertyType: "APARTMENT",
        price: 1000000,
        partnerId: sharer.partnerId,
        brokerId: sharer.broker.id,
        status: "PUBLISHED",
      },
    });
  });

  afterAll(async () => {
    await prisma.propertyShare.deleteMany({ where: { propertyId: property.id } });
    await prisma.property.delete({ where: { id: property.id } });
    const brokerIds = [sharer, recipient].map((x) => x.broker.id);
    const partnerIds = [sharer, recipient].map((x) => x.partnerId);
    const userIds = [sharer, recipient].map((x) => x.userId);
    await prisma.broker.deleteMany({ where: { id: { in: brokerIds } } });
    await prisma.partner.deleteMany({ where: { id: { in: partnerIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.$disconnect();
  });

  it("refuses to share a listing with yourself", async () => {
    await expect(shareProperty(property.id, sharer.broker.id, sharer.broker.id)).rejects.toThrow(/yourself/i);
  });

  it("refuses to share with a broker that does not exist", async () => {
    await expect(shareProperty(property.id, sharer.broker.id, "does-not-exist")).rejects.toThrow(/not found/i);
  });

  it("creates an active share and prevents a duplicate active share, visible to both sides", async () => {
    const share = await shareProperty(property.id, sharer.broker.id, recipient.broker.id);
    expect(share.status).toBe("ACTIVE");

    await expect(shareProperty(property.id, sharer.broker.id, recipient.broker.id)).rejects.toThrow(
      /already shared/i,
    );

    const shares = await listSharesForProperty(property.id);
    expect(shares.some((s) => s.id === share.id)).toBe(true);

    const sharedWithMe = await listSharedWithMe(recipient.broker.id);
    expect(sharedWithMe.some((s) => s.id === share.id)).toBe(true);
  });

  it("revokes a share, refuses a double revoke, and reactivates the same row on re-share", async () => {
    const existing = await prisma.propertyShare.findUniqueOrThrow({
      where: { propertyId_sharedWithBrokerId: { propertyId: property.id, sharedWithBrokerId: recipient.broker.id } },
    });

    const revoked = await revokeShare(existing.id);
    expect(revoked.status).toBe("REVOKED");
    expect(revoked.revokedAt).not.toBeNull();

    await expect(revokeShare(existing.id)).rejects.toThrow(/already been revoked/i);

    const sharedWithMeAfterRevoke = await listSharedWithMe(recipient.broker.id);
    expect(sharedWithMeAfterRevoke.some((s) => s.id === existing.id)).toBe(false);

    const reshared = await shareProperty(property.id, sharer.broker.id, recipient.broker.id);
    expect(reshared.id).toBe(existing.id);
    expect(reshared.status).toBe("ACTIVE");
  });
});
