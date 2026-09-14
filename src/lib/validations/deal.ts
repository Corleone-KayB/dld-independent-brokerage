import { z } from "zod";

export const dealStageEnum = z.enum([
  "VIEWING",
  "OFFER",
  "NEGOTIATION",
  "MOU",
  "CONTRACT",
  "PAYMENT",
  "TRANSFER",
  "COMMISSION",
  "CLOSED",
  "CANCELLED",
]);

export const dealCreateSchema = z.object({
  leadId: z.string().trim().optional(),
  clientId: z.string().trim().optional(),
  propertyId: z.string().trim().optional(),
  brokerId: z.string().trim().optional(),
  value: z.coerce.number().positive().optional(),
  deadline: z.coerce.date().optional(),
  notes: z.string().trim().max(2000).optional(),
});

export type DealCreateInput = z.infer<typeof dealCreateSchema>;

export const dealStageUpdateSchema = z.object({
  stage: dealStageEnum,
  value: z.coerce.number().positive().optional(),
  notes: z.string().trim().max(2000).optional(),
});

export type DealStageUpdateInput = z.infer<typeof dealStageUpdateSchema>;

export const commissionStatusUpdateSchema = z.object({
  status: z.enum(["EXPECTED", "APPROVED", "PAID", "DISPUTED"]),
  amount: z.coerce.number().positive().optional(),
  disputedReason: z.string().trim().max(1000).optional(),
});

export type CommissionStatusUpdateInput = z.infer<typeof commissionStatusUpdateSchema>;
