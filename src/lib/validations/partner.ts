import { z } from "zod";

export const partnerTypeEnum = z.enum([
  "INDEPENDENT_BROKER",
  "BROKERAGE_COMPANY",
  "PROPERTY_OWNER",
  "DEVELOPER",
  "INVESTOR",
  "CORPORATE_PARTNER",
  "SERVICE_PROVIDER",
]);

export const partnerApplicationSchema = z.object({
  // Step 1
  fullName: z.string().trim().min(2, "Full name is required").max(200),
  email: z.string().trim().email("A valid email is required"),
  mobile: z.string().trim().min(6, "A valid mobile number is required").max(30),
  company: z.string().trim().max(200).optional(),
  role: z.string().trim().max(120).optional(),
  // Step 2
  type: partnerTypeEnum,
  brokerNumber: z.string().trim().max(60).optional(),
  orn: z.string().trim().max(60).optional(),
  brokerage: z.string().trim().max(200).optional(),
  specialization: z.string().trim().max(200).optional(),
  areas: z.array(z.string().trim()).default([]),
  experienceYears: z.coerce.number().int().nonnegative().max(80).optional(),
  // Step 3
  licenseInfo: z.string().trim().max(500).optional(),
  practiceCardInfo: z.string().trim().max(500).optional(),
  // Step 4
  businessFocus: z.array(z.string().trim()).default([]),
  // Step 5
  acceptedTerms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the partner terms" }),
  }),
});

export type PartnerApplicationInput = z.infer<typeof partnerApplicationSchema>;

export const partnerStatusUpdateSchema = z.object({
  status: z.enum([
    "PENDING_VERIFICATION",
    "UNDER_REVIEW",
    "APPROVED",
    "REJECTED",
    "MORE_INFORMATION_REQUIRED",
    "SUSPENDED",
  ]),
  reviewNotes: z.string().trim().max(2000).optional(),
});

export type PartnerStatusUpdateInput = z.infer<typeof partnerStatusUpdateSchema>;
