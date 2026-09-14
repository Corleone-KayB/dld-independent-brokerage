import { z } from "zod";
import { propertyPurposeEnum } from "./property";

export const matchRequestSchema = z.object({
  budget: z.coerce.number().positive().optional(),
  purpose: propertyPurposeEnum.optional(),
  locations: z.array(z.string().trim()).default([]),
  bedrooms: z.coerce.number().int().nonnegative().optional(),
  minimumYield: z.coerce.number().nonnegative().optional(),
  completionStatus: z.string().trim().optional(),
});

export type MatchRequestInput = z.infer<typeof matchRequestSchema>;
