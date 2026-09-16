import "server-only";
import type { DealCollaboratorRole } from "@prisma/client";
import { prisma } from "@/server/db/client";
import { enforceRateLimit, hoursAgo, RATE_LIMITS } from "@/server/security/rate-limit";

/**
 * Authorization (deal-owner-or-admin for invite/remove, invited-broker-only
 * for accept/decline) is enforced by the route handlers using the existing
 * ownsPartnerResource/isInvolvedBroker helpers, matching the established
 * pattern in src/app/api/deals/[id]/stage/route.ts — this module only does
 * the DB work and the business-rule validation that isn't a permission
 * check (duplicate invite, self-invite, rate limit, invalid transition).
 */

export async function listCollaborators(dealId: string) {
  return prisma.dealCollaborator.findMany({
    where: { dealId },
    include: { broker: true },
    orderBy: { createdAt: "asc" },
  });
}

/** Deals another broker is helping on but does not own — for their own dashboard. */
export async function listMyCollaborations(brokerId: string) {
  return prisma.dealCollaborator.findMany({
    where: { brokerId },
    include: { deal: { include: { property: true, client: true, broker: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export interface CollaboratorInviteInput {
  brokerId: string;
  role: DealCollaboratorRole;
  splitPercent?: number;
}

export async function inviteCollaborator(dealId: string, invitedByUserId: string, input: CollaboratorInviteInput) {
  const deal = await prisma.deal.findUniqueOrThrow({ where: { id: dealId } });
  if (input.brokerId === deal.brokerId) {
    throw new Error("The deal's own broker is already on the deal");
  }

  const targetBroker = await prisma.broker.findUnique({ where: { id: input.brokerId } });
  if (!targetBroker) throw new Error("Broker not found");

  const existing = await prisma.dealCollaborator.findUnique({
    where: { dealId_brokerId: { dealId, brokerId: input.brokerId } },
  });
  if (existing && (existing.status === "INVITED" || existing.status === "ACCEPTED")) {
    throw new Error("This broker is already on this deal");
  }

  await enforceRateLimit({
    max: RATE_LIMITS.COLLAB_INVITES_PER_DAY,
    action: "deal collaboration invites",
    count: () => prisma.dealCollaborator.count({ where: { invitedByUserId, createdAt: { gte: hoursAgo(24) } } }),
  });

  if (existing) {
    return prisma.dealCollaborator.update({
      where: { id: existing.id },
      data: { role: input.role, splitPercent: input.splitPercent, status: "INVITED", invitedByUserId },
    });
  }

  return prisma.dealCollaborator.create({
    data: {
      dealId,
      brokerId: input.brokerId,
      role: input.role,
      splitPercent: input.splitPercent,
      status: "INVITED",
      invitedByUserId,
    },
  });
}

export async function respondToCollaboration(collaboratorId: string, actingBrokerId: string, accept: boolean) {
  return prisma.$transaction(async (tx) => {
    const collab = await tx.dealCollaborator.findUniqueOrThrow({ where: { id: collaboratorId } });
    if (collab.brokerId !== actingBrokerId) {
      throw new Error("Only the invited broker can respond to this invitation");
    }
    if (collab.status !== "INVITED") {
      throw new Error("This invitation is no longer pending");
    }
    return tx.dealCollaborator.update({
      where: { id: collaboratorId },
      data: { status: accept ? "ACCEPTED" : "DECLINED" },
    });
  });
}

export async function removeCollaborator(collaboratorId: string) {
  const collab = await prisma.dealCollaborator.findUniqueOrThrow({ where: { id: collaboratorId } });
  if (collab.status === "REMOVED") throw new Error("This collaborator has already been removed");
  return prisma.dealCollaborator.update({ where: { id: collaboratorId }, data: { status: "REMOVED" } });
}

export async function getCollaboratorWithDeal(collaboratorId: string) {
  return prisma.dealCollaborator.findUnique({ where: { id: collaboratorId }, include: { deal: true } });
}
