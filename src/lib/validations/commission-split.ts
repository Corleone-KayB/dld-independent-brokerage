import { z } from "zod";

export const commissionSplitCreateSchema = z.object({
  brokerId: z.string().min(1),
  percent: z.coerce.number().gt(0).max(100),
});

export const commissionSplitRejectSchema = z.object({
  reason: z.string().trim().min(1).max(500),
});
