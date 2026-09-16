import "server-only";
import { prisma } from "@/server/db/client";

/**
 * Commission split rules (decision 5): independent per-split approval,
 * each split carries its own amount/beneficiary/status/approval-state/
 * rejection-reason/approved_by/approved_at/paid_at, and once written the
 * amount/percent are never changed — only the status fields move forward.
 * Creation and approval are finance/admin-only (COMMISSIONS_MANAGE), same
 * as every other Commission mutation in this codebase; a holder of that
 * permission may still not approve/reject/mark-paid a split that pays out
 * to their own broker identity (self-dealing guard for dual-role users).
 */

export interface SplitCreateInput {
  brokerId: string;
  percent: number;
}

export async function createSplit(commissionId: string, input: SplitCreateInput) {
  if (input.percent <= 0 || input.percent > 100) {
    throw new Error("Split percent must be greater than 0 and at most 100");
  }

  return prisma.$transaction(async (tx) => {
    const commission = await tx.commission.findUniqueOrThrow({ where: { id: commissionId } });

    const broker = await tx.broker.findUnique({ where: { id: input.brokerId } });
    if (!broker) throw new Error("Broker not found");
    if (!broker.partnerId) throw new Error("Broker has no partner scope");

    const existingSplits = await tx.commissionSplit.findMany({
      where: { commissionId, status: { not: "REJECTED" } },
    });
    const allocatedPercent = existingSplits.reduce((sum, s) => sum + Number(s.percent), 0);
    if (allocatedPercent + input.percent > 100) {
      throw new Error(
        `This split would allocate ${(allocatedPercent + input.percent).toFixed(2)}% of the commission — only ${(100 - allocatedPercent).toFixed(2)}% remains unallocated`,
      );
    }

    const amount = (Number(commission.amount) * input.percent) / 100;

    return tx.commissionSplit.create({
      data: {
        commissionId,
        brokerId: input.brokerId,
        partnerId: broker.partnerId,
        percent: input.percent,
        amount,
        status: "PENDING",
      },
    });
  });
}

function assertNotSelfDealing(split: { brokerId: string }, actingBrokerId: string | null) {
  if (actingBrokerId && split.brokerId === actingBrokerId) {
    throw new Error("You cannot approve, reject, or mark paid a commission split that pays out to yourself");
  }
}

export async function approveSplit(splitId: string, actingUserId: string, actingBrokerId: string | null) {
  return prisma.$transaction(async (tx) => {
    const split = await tx.commissionSplit.findUniqueOrThrow({ where: { id: splitId } });
    assertNotSelfDealing(split, actingBrokerId);
    if (split.status !== "PENDING") throw new Error("This split is no longer pending");

    return tx.commissionSplit.update({
      where: { id: splitId },
      data: { status: "APPROVED", approvedByUserId: actingUserId, approvedAt: new Date() },
    });
  });
}

export async function rejectSplit(
  splitId: string,
  actingUserId: string,
  actingBrokerId: string | null,
  reason: string,
) {
  return prisma.$transaction(async (tx) => {
    const split = await tx.commissionSplit.findUniqueOrThrow({ where: { id: splitId } });
    assertNotSelfDealing(split, actingBrokerId);
    if (split.status !== "PENDING") throw new Error("This split is no longer pending");

    return tx.commissionSplit.update({
      where: { id: splitId },
      data: { status: "REJECTED", rejectionReason: reason, approvedByUserId: actingUserId },
    });
  });
}

export async function markSplitPaid(splitId: string, actingBrokerId: string | null) {
  return prisma.$transaction(async (tx) => {
    const split = await tx.commissionSplit.findUniqueOrThrow({ where: { id: splitId } });
    assertNotSelfDealing(split, actingBrokerId);
    if (split.status !== "APPROVED") throw new Error("Only an approved split can be marked as paid");

    return tx.commissionSplit.update({ where: { id: splitId }, data: { status: "PAID", paidAt: new Date() } });
  });
}

/** For the finance/admin split-creation broker picker — every verified broker is eligible. */
export async function listSplitCandidateBrokers() {
  return prisma.broker.findMany({
    where: { verificationStatus: { in: ["PLATFORM_VERIFIED", "OFFICIAL_SOURCE_VERIFIED"] } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function listSplitsForCommission(commissionId: string) {
  return prisma.commissionSplit.findMany({
    where: { commissionId },
    include: { broker: true },
    orderBy: { createdAt: "asc" },
  });
}

/** A broker's own view of splits paid or owed to them, across every commission. */
export async function listMySplits(brokerId: string) {
  return prisma.commissionSplit.findMany({
    where: { brokerId },
    include: { commission: { include: { deal: { include: { property: true, client: true } } } } },
    orderBy: { createdAt: "desc" },
  });
}
