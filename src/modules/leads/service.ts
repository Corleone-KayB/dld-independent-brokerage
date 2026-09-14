import "server-only";
import type { LeadStatus, Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";
import { notifications } from "@/server/notifications";
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

export async function createLead(
  partnerId: string,
  input: LeadCreateInput,
  source: "PUBLIC_ENQUIRY" | "CRM" = "CRM",
) {
  return prisma.lead.create({
    data: {
      partnerId,
      clientId: input.clientId,
      propertyId: input.propertyId,
      brokerId: input.brokerId,
      source: input.source ?? source,
      temperature: input.temperature,
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
