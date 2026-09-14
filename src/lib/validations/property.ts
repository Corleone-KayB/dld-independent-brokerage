import { z } from "zod";

export const propertyPurposeEnum = z.enum([
  "BUY",
  "RENT",
  "COMMERCIAL",
  "OFF_PLAN",
  "LUXURY",
  "INVESTMENT",
  "HOLIDAY",
]);

export const propertyTypeEnum = z.enum([
  "APARTMENT",
  "VILLA",
  "TOWNHOUSE",
  "PENTHOUSE",
  "OFFICE",
  "RETAIL",
  "WAREHOUSE",
  "LAND",
]);

export const propertySearchSchema = z.object({
  purpose: propertyPurposeEnum.optional(),
  location: z.string().trim().min(1).optional(),
  community: z.string().trim().min(1).optional(),
  propertyType: propertyTypeEnum.optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  minBedrooms: z.coerce.number().int().nonnegative().optional(),
  maxBedrooms: z.coerce.number().int().nonnegative().optional(),
  minBathrooms: z.coerce.number().int().nonnegative().optional(),
  maxBathrooms: z.coerce.number().int().nonnegative().optional(),
  minSize: z.coerce.number().nonnegative().optional(),
  maxSize: z.coerce.number().nonnegative().optional(),
  furnishing: z.string().trim().optional(),
  completionStatus: z.string().trim().optional(),
  developerId: z.string().trim().optional(),
  minYield: z.coerce.number().nonnegative().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(12),
});

export type PropertySearchInput = z.infer<typeof propertySearchSchema>;

export const propertyCreateSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().max(5000).optional(),
  purpose: propertyPurposeEnum,
  propertyType: propertyTypeEnum,
  price: z.coerce.number().positive(),
  rentalPrice: z.coerce.number().positive().optional(),
  sizeSqft: z.coerce.number().positive().optional(),
  bedrooms: z.coerce.number().int().nonnegative().optional(),
  bathrooms: z.coerce.number().int().nonnegative().optional(),
  furnishing: z.string().trim().optional(),
  completionStatus: z.string().trim().optional(),
  community: z.string().trim().optional(),
  building: z.string().trim().optional(),
  city: z.string().trim().default("Dubai"),
  developerName: z.string().trim().optional(),
  serviceCharge: z.coerce.number().nonnegative().optional(),
  rentalYield: z.coerce.number().nonnegative().optional(),
  roi: z.coerce.number().nonnegative().optional(),
  paymentPlan: z.string().trim().optional(),
  amenities: z.array(z.string().trim()).default([]),
  view: z.string().trim().optional(),
  parkingSpaces: z.coerce.number().int().nonnegative().optional(),
  images: z.array(z.string().url()).default([]),
  brokerId: z.string().trim().optional(),
});

export const propertyUpdateSchema = propertyCreateSchema.partial().extend({
  status: z.enum(["DRAFT", "PENDING_REVIEW", "PUBLISHED", "ARCHIVED"]).optional(),
  brokerId: z.string().trim().nullable().optional(),
});

export type PropertyCreateInput = z.infer<typeof propertyCreateSchema>;
export type PropertyUpdateInput = z.infer<typeof propertyUpdateSchema>;

/** Public "List My Property" submission (Property Owner Portal, Phase 2). */
export const ownerListingSchema = z
  .object({
    ownerName: z.string().trim().min(2, "Full name is required").max(200),
    ownerEmail: z.string().trim().email("A valid email is required"),
    ownerPhone: z.string().trim().min(6, "A valid mobile number is required").max(30),
    purpose: z.enum(["BUY", "RENT"]),
    propertyType: propertyTypeEnum,
    price: z.coerce.number().positive().optional(),
    rentalPrice: z.coerce.number().positive().optional(),
    bedrooms: z.coerce.number().int().nonnegative().optional(),
    sizeSqft: z.coerce.number().positive().optional(),
    community: z.string().trim().optional(),
    city: z.string().trim().default("Dubai"),
    images: z.array(z.string().url()).default([]),
    preferredBrokerId: z.string().trim().optional(),
    matchRequested: z.boolean().default(false),
  })
  .refine((data) => (data.purpose === "BUY" ? data.price !== undefined : data.rentalPrice !== undefined), {
    message: "Asking price is required to sell, rental price is required to rent",
    path: ["price"],
  });

export type OwnerListingInput = z.infer<typeof ownerListingSchema>;
