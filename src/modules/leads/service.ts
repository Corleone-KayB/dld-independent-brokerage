import "server-only";
import type { LeadStatus, Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";
import { notifications } from "@/server/notifications";
import { computeLeadScore } from "@/server/matching/lead-scoring";
import { rankBrokerMatches } from "@/server/matching/broker-match";
import type { LeadCreateInput, LeadUpdateInput } from "@/lib/validations/crm";

export async function listLeads(filters: {
  partnerId?: string;
  brokerId?: string;
  status?: LeadStatus;
}) {
  const where: Prisma.LeadWhereInput = {};
  if (filters.partnerId) where.partnerId = filters.partnerId;
  if (filters.brokerId) where.brokerId = filters.brokerId;
  if (filters.status) where.status = filters.status;

  return prisma.lead.findMany({
    where,
    include: { client: true, property: { select: { title: true, slug: true } }, broker: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getLead(id: string) {
  return prisma.lead.findUnique({
    where: { id },
    include: { client: true, property: true, broker: true, activities: { orderBy: { createdAt: "desc" } } },
  });
}

/**
 * Lead Distribution Engine: when a lead has no explicit broker, rank the
 * partner's own verified brokers by area/specialization fit
 * (src/server/matching/broker-match.ts) and auto-assign the top match.
 * Deterministic — same isolated-engine pattern as the rest of Phase 2/MVP.
 */
async function distributeLead(partnerId: string, community: string | null, specialization: string | null) {
  const brokers = await prisma.broker.findMany({
    where: { partnerId, verificationStatus: { in: ["PLATFORM_VERIFIED", "OFFICIAL_SOURCE_VERIFIED"] } },
  });
  if (brokers.length === 0) return null;

  const ranked = rankBrokerMatches(brokers, { community, specialization });
  return ranked[0] && ranked[0].score > 0 ? ranked[0].broker.id : null;
}

export async function createLead(
  partnerId: string,
  input: LeadCreateInput,
  source: "PUBLIC_ENQUIRY" | "CRM" = "CRM",
) {
  const client = input.clientId ? await prisma.client.findUnique({ where: { id: input.clientId } }) : null;
  const property = input.propertyId ? await prisma.property.findUnique({ where: { id: input.propertyId } }) : null;
  const leadSource = input.source ?? source;

  const { score, temperature } = computeLeadScore({
    hasBudget: input.budget !== undefined || !!client?.budget,
    hasClient: !!client,
    hasProperty: !!property,
    message: input.message,
    source: leadSource,
  });

  const brokerId =
    input.brokerId ??
    (await distributeLead(
      partnerId,
      client?.preferredLocations[0] ?? property?.community ?? null,
      client?.intent ?? null,
    ));

  return prisma.lead.create({
    data: {
      partnerId,
      clientId: input.clientId,
      propertyId: input.propertyId,
      brokerId,
      source: leadSource,
      temperature,
      score,
      message: input.message,
      budget: input.budget,
      status: "NEW",
    },
  });
}

export async function updateLead(id: string, input: LeadUpdateInput) {
  return prisma.lead.update({ where: { id }, data: input });
}

export async function assignLead(id: string, brokerId: string) {
  const lead = await prisma.lead.update({
    where: { id },
    data: { brokerId, status: "CONTACTED" },
    include: { broker: { include: { user: true } } },
  });

  if (lead.broker?.user.email) {
    await notifications.inApp(
      { userId: lead.broker.userId, email: lead.broker.user.email },
      {
        subject: "New lead assigned",
        body: `A new lead has been assigned to you.`,
        metadata: { leadId: lead.id },
      },
    );
  }

  return lead;
}

/** Lead Marketplace: leads released for any verified broker to request/accept. */
export async function listMarketplaceLeads() {
  return prisma.lead.findMany({
    where: { visibility: "MARKETPLACE" },
    include: { client: true, property: { select: { title: true, community: true } } },
    orderBy: { score: "desc" },
  });
}

export async function acceptMarketplaceLead(leadId: string, brokerId: string) {
  const broker = await prisma.broker.findUniqueOrThrow({ where: { id: brokerId } });
  if (!broker.partnerId) throw new Error("Broker has no partner scope");

  return prisma.$transaction(async (tx) => {
    const lead = await tx.lead.findUniqueOrThrow({ where: { id: leadId } });
    if (lead.visibility !== "MARKETPLACE") {
      throw new Error("This lead is no longer available in the marketplace");
    }

    return tx.lead.update({
      where: { id: leadId },
      data: {
        partnerId: broker.partnerId!,
        brokerId: broker.id,
        visibility: "PRIVATE",
        status: "CONTACTED",
      },
    });
  });
}
