import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";

export interface BrokerFilters {
  area?: string;
  specialization?: string;
  language?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

export async function searchBrokers(filters: BrokerFilters) {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 12;
  const where: Prisma.BrokerWhereInput = {};

  if (filters.area) where.areasServed = { has: filters.area };
  if (filters.specialization) where.specializations = { has: filters.specialization };
  if (filters.language) where.languages = { has: filters.language };
  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { bio: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.broker.findMany({
      where,
      include: { partner: true, properties: { where: { status: "PUBLISHED" }, take: 1 } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.broker.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getBrokerBySlug(slug: string) {
  return prisma.broker.findUnique({
    where: { slug },
    include: {
      partner: true,
      properties: { where: { status: "PUBLISHED" }, include: { images: { take: 1 } } },
    },
  });
}

export async function getBrokerById(id: string) {
  return prisma.broker.findUnique({ where: { id }, include: { partner: true } });
}
