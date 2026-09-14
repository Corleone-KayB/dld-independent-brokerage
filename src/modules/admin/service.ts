import "server-only";
import { prisma } from "@/server/db/client";

export async function getAdminDashboardStats() {
  const [
    totalPartners,
    verifiedBrokers,
    activeProperties,
    activeLeads,
    pendingApplications,
    complianceIssues,
    activeDeals,
    closedDeals,
    revenueAgg,
    commissionAgg,
    totalLeads,
    closedLeads,
  ] = await Promise.all([
    prisma.partner.count(),
    prisma.broker.count({ where: { verificationStatus: { in: ["PLATFORM_VERIFIED", "OFFICIAL_SOURCE_VERIFIED"] } } }),
    prisma.property.count({ where: { status: "PUBLISHED" } }),
    prisma.lead.count({ where: { status: { notIn: ["CLOSED", "LOST"] } } }),
    prisma.partnerApplication.count({ where: { status: { in: ["PENDING_VERIFICATION", "UNDER_REVIEW"] } } }),
    prisma.complianceDocument.count({ where: { verificationStatus: { in: ["PENDING", "EXPIRED", "REJECTED"] } } }),
    prisma.deal.count({ where: { stage: { notIn: ["CLOSED", "CANCELLED"] } } }),
    prisma.deal.count({ where: { stage: "CLOSED" } }),
    prisma.deal.aggregate({ where: { stage: "CLOSED" }, _sum: { value: true } }),
    prisma.commission.aggregate({ where: { status: { in: ["EXPECTED", "APPROVED", "PAID"] } }, _sum: { amount: true } }),
    prisma.lead.count(),
    prisma.lead.count({ where: { status: "CLOSED" } }),
  ]);

  return {
    totalPartners,
    verifiedBrokers,
    activeProperties,
    activeLeads,
    pendingApplications,
    complianceIssues,
    activeDeals,
    closedDeals,
    revenue: Number(revenueAgg._sum.value ?? 0),
    commission: Number(commissionAgg._sum.amount ?? 0),
    conversionRate: totalLeads > 0 ? Math.round((closedLeads / totalLeads) * 100) : 0,
  };
}

export async function listAuditLogs(page = 1, pageSize = 30) {
  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      include: { actor: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count(),
  ]);
  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}
