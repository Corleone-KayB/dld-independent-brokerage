import { z } from "zod";

export const clientCreateSchema = z.object({
  name: z.string().trim().min(2).max(200),
  phone: z.string().trim().max(30).optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  nationality: z.string().trim().max(100).optional(),
  intent: z.string().trim().max(50).optional(),
  budget: z.coerce.number().nonnegative().optional(),
  preferredLocations: z.array(z.string().trim()).default([]),
  propertyRequirements: z.string().trim().max(2000).optional(),
  financingStatus: z.string().trim().max(100).optional(),
  leadSource: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(4000).optional(),
});

export const clientUpdateSchema = clientCreateSchema.partial();

export type ClientCreateInput = z.infer<typeof clientCreateSchema>;
export type ClientUpdateInput = z.infer<typeof clientUpdateSchema>;

export const leadCreateSchema = z.object({
  clientId: z.string().trim().optional(),
  propertyId: z.string().trim().optional(),
  brokerId: z.string().trim().optional(),
  source: z.string().trim().max(100).optional(),
  message: z.string().trim().max(2000).optional(),
  budget: z.coerce.number().nonnegative().optional(),
});

export const leadUpdateSchema = z.object({
  status: z
    .enum([
      "NEW",
      "CONTACTED",
      "QUALIFIED",
      "VIEWING",
      "NEGOTIATION",
      "OFFER",
      "CONTRACT",
      "CLOSED",
      "LOST",
    ])
    .optional(),
  temperature: z.enum(["HOT", "WARM", "COLD"]).optional(),
  message: z.string().trim().max(2000).optional(),
  budget: z.coerce.number().nonnegative().optional(),
  visibility: z.enum(["PRIVATE", "MARKETPLACE"]).optional(),
});

export const leadAssignSchema = z.object({
  brokerId: z.string().trim().min(1, "brokerId is required"),
});

export type LeadCreateInput = z.infer<typeof leadCreateSchema>;
export type LeadUpdateInput = z.infer<typeof leadUpdateSchema>;

export const activityCreateSchema = z.object({
  clientId: z.string().trim().optional(),
  leadId: z.string().trim().optional(),
  type: z.string().trim().min(1).max(60),
  note: z.string().trim().min(1).max(4000),
});

export type ActivityCreateInput = z.infer<typeof activityCreateSchema>;

export const appointmentCreateSchema = z.object({
  clientId: z.string().trim().optional(),
  brokerId: z.string().trim().optional(),
  propertyId: z.string().trim().optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const appointmentUpdateSchema = z.object({
  status: z.enum(["SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  notes: z.string().trim().max(2000).optional(),
});

export type AppointmentCreateInput = z.infer<typeof appointmentCreateSchema>;
export type AppointmentUpdateInput = z.infer<typeof appointmentUpdateSchema>;
