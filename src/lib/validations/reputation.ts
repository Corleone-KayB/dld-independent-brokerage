import { z } from "zod";

export const reviewCreateSchema = z
  .object({
    revieweeBrokerId: z.string().min(1),
    dealId: z.string().min(1).optional(),
    referralId: z.string().min(1).optional(),
    rating: z.coerce.number().int().min(1).max(5),
    comment: z.string().trim().max(1000).optional(),
  })
  .refine((data) => !!data.dealId !== !!data.referralId, {
    message: "Provide exactly one of dealId or referralId",
  });
