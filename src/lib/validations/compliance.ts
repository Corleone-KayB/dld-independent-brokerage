import { z } from "zod";

export const complianceDocumentTypeEnum = z.enum([
  "TRADE_LICENSE",
  "BROKER_CARD",
  "PROFESSIONAL_CREDENTIAL",
  "IDENTIFICATION",
  "AGREEMENT",
  "OTHER",
]);

export const complianceDocumentCreateSchema = z.object({
  partnerId: z.string().trim().min(1),
  type: complianceDocumentTypeEnum,
  name: z.string().trim().min(1).max(200),
  storageKey: z.string().trim().min(1),
  mimeType: z.string().trim().max(120).optional(),
  expiresAt: z.coerce.date().optional(),
});

export type ComplianceDocumentCreateInput = z.infer<typeof complianceDocumentCreateSchema>;

export const complianceDocumentVerifySchema = z.object({
  verificationStatus: z.enum(["PENDING", "PLATFORM_VERIFIED", "REJECTED", "EXPIRED"]),
});

export type ComplianceDocumentVerifyInput = z.infer<typeof complianceDocumentVerifySchema>;
