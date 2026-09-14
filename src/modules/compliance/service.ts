import "server-only";
import type { VerificationStatus } from "@prisma/client";
import { prisma } from "@/server/db/client";
import type { ComplianceDocumentCreateInput } from "@/lib/validations/compliance";

export async function listComplianceDocuments(partnerId: string) {
  return prisma.complianceDocument.findMany({
    where: { partnerId },
    orderBy: { createdAt: "desc" },
  });
}

export async function listAllComplianceDocuments() {
  return prisma.complianceDocument.findMany({
    include: { partner: { select: { id: true, companyName: true, email: true, type: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createComplianceDocument(input: ComplianceDocumentCreateInput) {
  return prisma.complianceDocument.create({ data: input });
}

export async function getComplianceDocument(id: string) {
  return prisma.complianceDocument.findUnique({ where: { id } });
}

/**
 * Manual/platform verification only. OFFICIAL_SOURCE_VERIFIED intentionally
 * cannot be set here — it may only originate from a genuine authorized DLD
 * data integration (none exists in MVP).
 */
export async function verifyComplianceDocument(
  id: string,
  verifiedById: string,
  status: Exclude<VerificationStatus, "OFFICIAL_SOURCE_VERIFIED">,
) {
  return prisma.complianceDocument.update({
    where: { id },
    data: {
      verificationStatus: status,
      verifiedAt: new Date(),
      verifiedById,
    },
  });
}

export function documentExpiryState(expiresAt: Date | null): "none" | "expired" | "expiring" | "valid" {
  if (!expiresAt) return "none";
  const daysUntilExpiry = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (daysUntilExpiry < 0) return "expired";
  if (daysUntilExpiry <= 30) return "expiring";
  return "valid";
}
