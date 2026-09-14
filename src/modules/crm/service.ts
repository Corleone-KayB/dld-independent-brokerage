import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";
import type {
  ClientCreateInput,
  ClientUpdateInput,
  ActivityCreateInput,
  AppointmentCreateInput,
  AppointmentUpdateInput,
} from "@/lib/validations/crm";

export async function listClients(partnerId: string) {
  return prisma.client.findMany({
    where: { partnerId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { leads: true, appointments: true } } },
  });
}

export async function getClient(id: string) {
  return prisma.client.findUnique({
    where: { id },
    include: {
      leads: { orderBy: { createdAt: "desc" } },
      activities: { orderBy: { createdAt: "desc" } },
      appointments: { orderBy: { startsAt: "desc" } },
    },
  });
}

export async function createClient(partnerId: string, input: ClientCreateInput) {
  return prisma.client.create({
    data: {
      partnerId,
      name: input.name,
      phone: input.phone,
      email: input.email || undefined,
      nationality: input.nationality,
      intent: input.intent,
      budget: input.budget,
      preferredLocations: input.preferredLocations,
      propertyRequirements: input.propertyRequirements,
      financingStatus: input.financingStatus,
      leadSource: input.leadSource,
      notes: input.notes,
    },
  });
}

export async function updateClient(id: string, input: ClientUpdateInput) {
  return prisma.client.update({
    where: { id },
    data: { ...input, email: input.email || undefined },
  });
}

export async function createActivity(userId: string, input: ActivityCreateInput) {
  return prisma.activity.create({
    data: {
      userId,
      clientId: input.clientId,
      leadId: input.leadId,
      type: input.type,
      note: input.note,
    },
  });
}

export async function listAppointments(filters: { partnerId: string; brokerId?: string }) {
  const where: Prisma.AppointmentWhereInput = { partnerId: filters.partnerId };
  if (filters.brokerId) where.brokerId = filters.brokerId;
  return prisma.appointment.findMany({
    where,
    include: { client: true, broker: true, property: { select: { title: true, slug: true } } },
    orderBy: { startsAt: "asc" },
  });
}

export async function createAppointment(partnerId: string, input: AppointmentCreateInput) {
  return prisma.appointment.create({
    data: {
      partnerId,
      clientId: input.clientId,
      brokerId: input.brokerId,
      propertyId: input.propertyId,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      notes: input.notes,
    },
  });
}

export async function updateAppointment(id: string, input: AppointmentUpdateInput) {
  return prisma.appointment.update({ where: { id }, data: input });
}
