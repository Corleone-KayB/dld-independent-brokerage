import { z } from "zod";
import { propertyTypeEnum } from "./property";

export const projectCreateSchema = z.object({
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().max(5000).optional(),
  community: z.string().trim().optional(),
  city: z.string().trim().default("Dubai"),
  completionDate: z.coerce.date().optional(),
  brochureUrl: z.string().url().optional().or(z.literal("")),
  amenities: z.array(z.string().trim()).default([]),
  images: z.array(z.string().url()).default([]),
});

export const projectUpdateSchema = projectCreateSchema.partial().extend({
  status: z.enum(["DRAFT", "PENDING_REVIEW", "PUBLISHED", "ARCHIVED"]).optional(),
});

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;

export const projectUnitCreateSchema = z.object({
  unitNumber: z.string().trim().max(50).optional(),
  propertyType: propertyTypeEnum,
  bedrooms: z.coerce.number().int().nonnegative().optional(),
  bathrooms: z.coerce.number().int().nonnegative().optional(),
  sizeSqft: z.coerce.number().positive().optional(),
  price: z.coerce.number().positive(),
  paymentPlan: z.string().trim().max(200).optional(),
});

export const projectUnitUpdateSchema = projectUnitCreateSchema.partial().extend({
  status: z.enum(["DRAFT", "PENDING_REVIEW", "PUBLISHED", "ARCHIVED"]).optional(),
});

export type ProjectUnitCreateInput = z.infer<typeof projectUnitCreateSchema>;
export type ProjectUnitUpdateInput = z.infer<typeof projectUnitUpdateSchema>;
