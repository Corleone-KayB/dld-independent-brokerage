import "server-only";
import type { DealStage, Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";
import { COMMISSION_DEFAULT_RATE } from "@/lib/constants";
import { notifications } from "@/server/notifications";
import type { DealCreateInput, DealStageUpdateInput } from "@/lib/validations/deal";

export async function listDeals(filters: { partnerId?: string; brokerId?: string; stage?: DealStage }) {
  const where: Prisma.DealWhereInput = {};
  if (filters.partnerId) where.partnerId = filters.partnerId;
  if (filters.brokerId) where.brokerId = filters.brokerId;
  if (filters.stage) where.stage = filters.stage;

  return prisma.deal.findMany({
    where,
    include: { client: true, property: { select: { title: true, slug: true } }, broker: true, commission: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDeal(id: string) {
  return prisma.deal.findUnique({
    where: { id },
    include: { client: true, property: true, broker: true, commission: true, lead: true },
  });
}

export async function createDeal(partnerId: string, input: DealCreateInput) {
  return prisma.deal.create({
    data: {
      partnerId,
      leadId: input.leadId,
      clientId: input.clientId,
      propertyId: input.propertyId,
      brokerId: input.brokerId,
      value: input.value,
      deadline: input.deadline,
      notes: input.notes,
      stage: "VIEWING",
    },
    include: { client: true, property: true, broker: true },
  });
}

/**
 * Advances a deal's stage. Reaching COMMISSION auto-creates the Commission
 * record (default rate applied to the deal value) if one doesn't exist yet
 * — finance can adjust the amount before approving. Every transition is
 * notified to the responsible broker.
 */
export async function updateDealStage(id: string, input: DealStageUpdateInput) {
  const deal = await prisma.$transaction(async (tx) => {
    const updated = await tx.deal.update({
      where: { id },
      data: {
        stage: input.stage,
        value: input.value,
        notes: input.notes,
      },
      include: { broker: { include: { user: true } }, commission: true },
    });

    if (input.stage === "COMMISSION" && !updated.commission && updated.value) {
      await tx.commission.create({
        data: {
          dealId: updated.id,
          partnerId: updated.partnerId,
          brokerId: updated.brokerId,
          amount: Number(updated.value) * COMMISSION_DEFAULT_RATE,
          status: "PENDING",
        },
      });
    }

    return updated;
  });

  if (deal.broker?.user.email) {
    await notifications.inApp(
      { userId: deal.brokerId!, email: deal.broker.user.email },
      { subject: "Deal update", body: `Your deal has moved to stage: ${input.stage}.`, metadata: { dealId: deal.id } },
    );
  }

  return prisma.deal.findUniqueOrThrow({ where: { id }, include: { commission: true } });
}
