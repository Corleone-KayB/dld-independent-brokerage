import { z } from "zod";

export const networkOptInSchema = z.object({
  optIn: z.boolean(),
});

export const connectionRequestSchema = z.object({
  targetBrokerId: z.string().min(1),
});

export const conversationStartSchema = z.object({
  brokerId: z.string().min(1),
});

export const messageSendSchema = z.object({
  body: z.string().trim().min(1).max(4000),
});

export const referralCreateSchema = z.object({
  receivingBrokerId: z.string().min(1),
  clientSnapshotName: z.string().trim().min(1).max(200),
  clientSnapshotPhone: z.string().trim().max(50).optional(),
  clientSnapshotEmail: z.string().trim().email().max(200).optional(),
  clientSnapshotBudget: z.coerce.number().nonnegative().optional(),
  requirementNotes: z.string().trim().max(2000).optional(),
  proposedSplitPercent: z.coerce.number().min(0).max(100).optional(),
  sourceLeadId: z.string().min(1).optional(),
});

export const referralDeclineSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const referralStatusUpdateSchema = z.object({
  status: z.enum(["IN_PROGRESS", "CONVERTED", "CLOSED"]),
  resultingDealId: z.string().min(1).optional(),
});
