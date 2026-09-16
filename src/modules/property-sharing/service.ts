import "server-only";
import { prisma } from "@/server/db/client";
import { enforceRateLimit, hoursAgo, RATE_LIMITS } from "@/server/security/rate-limit";

/**
 * Whether the acting user may manage shares for this property (partner-team
 * ownership, matching the existing PATCH/DELETE property routes) is checked
 * by the route handlers, not here — this module only does the DB work and
 * the business rules that aren't a permission check (self-share, duplicate
 * active share, rate limit).
 */
export async function shareProperty(propertyId: string, sharingBrokerId: string, targetBrokerId: string) {
  if (sharingBrokerId === targetBrokerId) {
    throw new Error("You cannot share a listing with yourself");
  }

  const targetBroker = await prisma.broker.findUnique({ where: { id: targetBrokerId } });
  if (!targetBroker) throw new Error("Broker not found");

  const existing = await prisma.propertyShare.findUnique({
    where: { propertyId_sharedWithBrokerId: { propertyId, sharedWithBrokerId: targetBrokerId } },
  });
  if (existing && existing.status === "ACTIVE") {
    throw new Error("This listing is already shared with this broker");
  }

  await enforceRateLimit({
    max: RATE_LIMITS.PROPERTY_SHARES_PER_DAY,
    action: "listing shares",
    count: () => prisma.propertyShare.count({ where: { sharingBrokerId, createdAt: { gte: hoursAgo(24) } } }),
  });

  if (existing) {
    return prisma.propertyShare.update({
      where: { id: existing.id },
      data: { status: "ACTIVE", sharingBrokerId, revokedAt: null },
    });
  }

  return prisma.propertyShare.create({
    data: { propertyId, sharingBrokerId, sharedWithBrokerId: targetBrokerId, status: "ACTIVE" },
  });
}

export async function getShareWithProperty(shareId: string) {
  return prisma.propertyShare.findUnique({ where: { id: shareId }, include: { property: true } });
}

export async function revokeShare(shareId: string) {
  const share = await prisma.propertyShare.findUniqueOrThrow({ where: { id: shareId } });
  if (share.status === "REVOKED") throw new Error("This share has already been revoked");
  return prisma.propertyShare.update({ where: { id: shareId }, data: { status: "REVOKED", revokedAt: new Date() } });
}

export async function listSharesForProperty(propertyId: string) {
  return prisma.propertyShare.findMany({
    where: { propertyId },
    include: { recipientBroker: true },
    orderBy: { createdAt: "desc" },
  });
}

/** Listings other brokers have shared with me — I can show these to my own clients. */
export async function listSharedWithMe(brokerId: string) {
  return prisma.propertyShare.findMany({
    where: { sharedWithBrokerId: brokerId, status: "ACTIVE" },
    include: { property: true, sharingBroker: true },
    orderBy: { createdAt: "desc" },
  });
}
