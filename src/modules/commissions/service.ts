import "server-only";
import type { CommissionStatus, Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";
import type { CommissionStatusUpdateInput } from "@/lib/validations/deal";

export async function listCommissions(filters: { partnerId?: string; brokerId?: string; status?: CommissionStatus }) {
  const where: Prisma.CommissionWhereInput = {};
  if (filters.partnerId) where.partnerId = filters.partnerId;
  if (filters.brokerId) where.brokerId = filters.brokerId;
  if (filters.status) where.status = filters.status;

  return prisma.commission.findMany({
    where,
    include: { deal: { include: { property: { select: { title: true } } } }, broker: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCommission(id: string) {
  return prisma.commission.findUnique({
    where: { id },
    include: { deal: { include: { property: true, client: true } } },
  });
}

export async function updateCommissionStatus(id: string, input: CommissionStatusUpdateInput) {
  return prisma.commission.update({
    where: { id },
    data: {
      status: input.status,
      amount: input.amount,
      disputedReason: input.status === "DISPUTED" ? input.disputedReason : null,
      approvedAt: input.status === "APPROVED" ? new Date() : undefined,
      paidAt: input.status === "PAID" ? new Date() : undefined,
    },
  });
}

export async function getCommissionSummary(filters: { partnerId?: string; brokerId?: string }) {
  const where: Prisma.CommissionWhereInput = {};
  if (filters.partnerId) where.partnerId = filters.partnerId;
  if (filters.brokerId) where.brokerId = filters.brokerId;

  const rows = await prisma.commission.groupBy({
    by: ["status"],
    where,
    _sum: { amount: true },
    _count: true,
  });

  const summary: Record<CommissionStatus, { total: number; count: number }> = {
    PENDING: { total: 0, count: 0 },
    EXPECTED: { total: 0, count: 0 },
    APPROVED: { total: 0, count: 0 },
    PAID: { total: 0, count: 0 },
    DISPUTED: { total: 0, count: 0 },
  };

  for (const row of rows) {
    summary[row.status] = { total: Number(row._sum.amount ?? 0), count: row._count };
  }

  return summary;
}
