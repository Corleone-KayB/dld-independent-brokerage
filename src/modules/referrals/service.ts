import "server-only";
import type { ReferralStatus } from "@prisma/client";
import { prisma } from "@/server/db/client";
import { enforceRateLimit, hoursAgo, RATE_LIMITS } from "@/server/security/rate-limit";
import { computeLeadScore } from "@/server/matching/lead-scoring";

export interface ReferralCreateInput {
  receivingBrokerId: string;
  clientSnapshotName: string;
  clientSnapshotPhone?: string;
  clientSnapshotEmail?: string;
  clientSnapshotBudget?: number;
  requirementNotes?: string;
  proposedSplitPercent?: number;
  sourceLeadId?: string;
}

/**
 * No NetworkConnection is required to send a referral (decision 3) — the
 * abuse brake here is the two rate limits below instead.
 */
export async function createReferral(referringBrokerId: string, input: ReferralCreateInput) {
  if (referringBrokerId === input.receivingBrokerId) {
    throw new Error("You cannot refer a client to yourself");
  }

  const [referringBroker, receivingBroker] = await Promise.all([
    prisma.broker.findUniqueOrThrow({ where: { id: referringBrokerId } }),
    prisma.broker.findUnique({ where: { id: input.receivingBrokerId } }),
  ]);
  if (!receivingBroker) throw new Error("Broker not found");
  if (!referringBroker.partnerId || !receivingBroker.partnerId) {
    throw new Error("Both brokers must have an active partner account to exchange referrals");
  }

  if (input.sourceLeadId) {
    const lead = await prisma.lead.findUnique({ where: { id: input.sourceLeadId } });
    if (!lead || lead.brokerId !== referringBrokerId) {
      throw new Error("You can only refer a lead that is assigned to you");
    }
  }

  await enforceRateLimit({
    max: RATE_LIMITS.REFERRALS_PER_DAY,
    action: "referrals sent",
    count: () => prisma.referral.count({ where: { referringBrokerId, createdAt: { gte: hoursAgo(24) } } }),
  });
  await enforceRateLimit({
    max: RATE_LIMITS.REFERRALS_TO_SAME_BROKER_PER_DAY,
    action: "referrals to the same broker",
    count: () =>
      prisma.referral.count({
        where: {
          referringBrokerId,
          receivingBrokerId: input.receivingBrokerId,
          createdAt: { gte: hoursAgo(24) },
        },
      }),
  });

  return prisma.referral.create({
    data: {
      referringBrokerId,
      referringPartnerId: referringBroker.partnerId,
      receivingBrokerId: input.receivingBrokerId,
      receivingPartnerId: receivingBroker.partnerId,
      sourceLeadId: input.sourceLeadId,
      clientSnapshotName: input.clientSnapshotName,
      clientSnapshotPhone: input.clientSnapshotPhone,
      clientSnapshotEmail: input.clientSnapshotEmail,
      clientSnapshotBudget: input.clientSnapshotBudget,
      requirementNotes: input.requirementNotes,
      proposedSplitPercent: input.proposedSplitPercent,
      status: "SENT",
    },
  });
}

/**
 * Accepting locks the proposed terms into acceptedSplitPercent/acceptedAt —
 * per decision 6 these fields are never written to again after this point.
 * Also materializes the client-snapshot into a real Client+Lead in the
 * receiving broker's own CRM, so a referral is an actionable handoff, not
 * just metadata.
 */
export async function acceptReferral(referralId: string, actingBrokerId: string, actingUserId: string) {
  return prisma.$transaction(async (tx) => {
    const referral = await tx.referral.findUniqueOrThrow({ where: { id: referralId } });
    if (referral.receivingBrokerId !== actingBrokerId) {
      throw new Error("Only the receiving broker can accept this referral");
    }
    if (referral.status !== "SENT") {
      throw new Error("This referral is no longer pending");
    }

    const client = await tx.client.create({
      data: {
        partnerId: referral.receivingPartnerId,
        name: referral.clientSnapshotName ?? "Referred Client",
        phone: referral.clientSnapshotPhone,
        email: referral.clientSnapshotEmail,
        budget: referral.clientSnapshotBudget ?? undefined,
        notes: referral.requirementNotes,
        leadSource: "Network Referral",
      },
    });

    const { score, temperature } = computeLeadScore({
      hasBudget: referral.clientSnapshotBudget !== null,
      hasClient: true,
      hasProperty: false,
      message: referral.requirementNotes ?? undefined,
      source: "Network Referral",
    });

    const lead = await tx.lead.create({
      data: {
        partnerId: referral.receivingPartnerId,
        clientId: client.id,
        brokerId: referral.receivingBrokerId,
        budget: referral.clientSnapshotBudget ?? undefined,
        message: referral.requirementNotes,
        source: "Network Referral",
        score,
        temperature,
        status: "NEW",
      },
    });

    return tx.referral.update({
      where: { id: referralId },
      data: {
        status: "ACCEPTED",
        acceptedSplitPercent: referral.proposedSplitPercent,
        acceptedAt: new Date(),
        acceptedByUserId: actingUserId,
        resultingLeadId: lead.id,
      },
    });
  });
}

export async function declineReferral(referralId: string, actingBrokerId: string, reason?: string) {
  return prisma.$transaction(async (tx) => {
    const referral = await tx.referral.findUniqueOrThrow({ where: { id: referralId } });
    if (referral.receivingBrokerId !== actingBrokerId) {
      throw new Error("Only the receiving broker can decline this referral");
    }
    if (referral.status !== "SENT") {
      throw new Error("This referral is no longer pending");
    }
    return tx.referral.update({
      where: { id: referralId },
      data: { status: "DECLINED", declineReason: reason ?? null },
    });
  });
}

export async function cancelReferral(referralId: string, actingBrokerId: string) {
  return prisma.$transaction(async (tx) => {
    const referral = await tx.referral.findUniqueOrThrow({ where: { id: referralId } });
    if (referral.referringBrokerId !== actingBrokerId) {
      throw new Error("Only the referring broker can cancel this referral");
    }
    if (referral.status !== "SENT") {
      throw new Error("This referral is no longer pending");
    }
    return tx.referral.update({ where: { id: referralId }, data: { status: "CANCELLED" } });
  });
}

const ALLOWED_TRANSITIONS: Partial<Record<ReferralStatus, ReferralStatus[]>> = {
  ACCEPTED: ["IN_PROGRESS", "CLOSED"],
  IN_PROGRESS: ["CONVERTED", "CLOSED"],
};

/** The receiving broker tracks their own working progress on the resulting lead — no automatic triggers. */
export async function advanceReferralStatus(
  referralId: string,
  actingBrokerId: string,
  nextStatus: "IN_PROGRESS" | "CONVERTED" | "CLOSED",
  resultingDealId?: string,
) {
  return prisma.$transaction(async (tx) => {
    const referral = await tx.referral.findUniqueOrThrow({ where: { id: referralId } });
    if (referral.receivingBrokerId !== actingBrokerId) {
      throw new Error("Only the receiving broker can update this referral's progress");
    }
    const allowed = ALLOWED_TRANSITIONS[referral.status] ?? [];
    if (!allowed.includes(nextStatus)) {
      throw new Error(`Cannot move a referral from ${referral.status} to ${nextStatus}`);
    }
    return tx.referral.update({
      where: { id: referralId },
      data: {
        status: nextStatus,
        resultingDealId: resultingDealId ?? referral.resultingDealId,
      },
    });
  });
}

/** No opt-in requirement — decision 3 only gates messaging on network membership, not referrals. */
export async function listReferrableBrokers(viewerBrokerId: string) {
  return prisma.broker.findMany({
    where: {
      id: { not: viewerBrokerId },
      verificationStatus: { in: ["PLATFORM_VERIFIED", "OFFICIAL_SOURCE_VERIFIED"] },
    },
    select: { id: true, slug: true, name: true, areasServed: true, specializations: true },
    orderBy: { name: "asc" },
  });
}

export async function listMyReferrals(brokerId: string) {
  const [sent, received] = await Promise.all([
    prisma.referral.findMany({
      where: { referringBrokerId: brokerId },
      include: { receivingBroker: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.referral.findMany({
      where: { receivingBrokerId: brokerId },
      include: { referringBroker: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return { sent, received };
}
