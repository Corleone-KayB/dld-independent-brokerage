import "server-only";
import { prisma } from "@/server/db/client";

export interface BrokerPerformance {
  brokerId: string;
  brokerName: string;
  activeListings: number;
  totalLeads: number;
  closedLeads: number;
  conversionRatePercent: number;
  closedDeals: number;
  totalCommissionEarned: number;
  performanceScore: number;
}

const WEIGHTS = { conversion: 35, closedDeals: 30, commission: 20, listings: 15 };

/**
 * Broker performance ranking (spec §7 "Performance statistics", §23
 * "partner performance") — deterministic weighted score from real,
 * queryable activity: conversion rate, closed deals, commission earned,
 * active listings. No external rating service is called.
 */
export async function rankBrokerPerformance(): Promise<BrokerPerformance[]> {
  const brokers = await prisma.broker.findMany({ select: { id: true, name: true } });

  const stats = await Promise.all(
    brokers.map(async (broker) => {
      const [activeListings, totalLeads, closedLeads, closedDeals, commissionAgg] = await Promise.all([
        prisma.property.count({ where: { brokerId: broker.id, status: "PUBLISHED" } }),
        prisma.lead.count({ where: { brokerId: broker.id } }),
        prisma.lead.count({ where: { brokerId: broker.id, status: "CLOSED" } }),
        prisma.deal.count({ where: { brokerId: broker.id, stage: "CLOSED" } }),
        prisma.commission.aggregate({
          where: { brokerId: broker.id, status: { in: ["APPROVED", "PAID"] } },
          _sum: { amount: true },
        }),
      ]);

      const conversionRatePercent = totalLeads > 0 ? (closedLeads / totalLeads) * 100 : 0;
      const totalCommissionEarned = Number(commissionAgg._sum.amount ?? 0);

      return { broker, activeListings, totalLeads, closedLeads, conversionRatePercent, closedDeals, totalCommissionEarned };
    }),
  );

  const maxCommission = Math.max(1, ...stats.map((s) => s.totalCommissionEarned));
  const maxListings = Math.max(1, ...stats.map((s) => s.activeListings));
  const maxDeals = Math.max(1, ...stats.map((s) => s.closedDeals));

  return stats
    .map((s) => {
      const performanceScore = Math.round(
        (s.conversionRatePercent / 100) * WEIGHTS.conversion +
          (s.closedDeals / maxDeals) * WEIGHTS.closedDeals +
          (s.totalCommissionEarned / maxCommission) * WEIGHTS.commission +
          (s.activeListings / maxListings) * WEIGHTS.listings,
      );

      return {
        brokerId: s.broker.id,
        brokerName: s.broker.name,
        activeListings: s.activeListings,
        totalLeads: s.totalLeads,
        closedLeads: s.closedLeads,
        conversionRatePercent: Math.round(s.conversionRatePercent),
        closedDeals: s.closedDeals,
        totalCommissionEarned: s.totalCommissionEarned,
        performanceScore,
      };
    })
    .sort((a, b) => b.performanceScore - a.performanceScore);
}
