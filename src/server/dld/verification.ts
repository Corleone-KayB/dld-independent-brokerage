import type { VerificationStatus } from "@prisma/client";

export interface VerificationDisplay {
  label: string;
  description: string;
  tone: "success" | "warning" | "neutral" | "danger";
}

/**
 * Maps internal VerificationStatus to non-misleading UI copy.
 * OFFICIAL_SOURCE_VERIFIED must only ever be set from a genuine authorized
 * DLD data source integration (Tier 2) — never fabricated. MVP has no such
 * integration wired up, so seed data never uses it.
 */
export function describeVerification(
  status: VerificationStatus,
  lastVerifiedAt: Date | null,
): VerificationDisplay {
  const lastChecked = lastVerifiedAt
    ? new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(lastVerifiedAt)
    : null;

  switch (status) {
    case "OFFICIAL_SOURCE_VERIFIED":
      return {
        label: "Verified against official DLD source",
        description: lastChecked
          ? `Confirmed against an authorized Dubai Land Department source on ${lastChecked}.`
          : "Confirmed against an authorized Dubai Land Department source.",
        tone: "success",
      };
    case "PLATFORM_VERIFIED":
      return {
        label: "Platform Verified",
        description: lastChecked
          ? `Manually reviewed by our compliance team on ${lastChecked}. Not an official DLD verification.`
          : "Manually reviewed by our compliance team. Not an official DLD verification.",
        tone: "neutral",
      };
    case "EXPIRED":
      return {
        label: "Verification Expired",
        description: "This verification has lapsed and requires renewal.",
        tone: "danger",
      };
    case "REJECTED":
      return {
        label: "Verification Rejected",
        description: "Submitted credentials could not be verified.",
        tone: "danger",
      };
    case "PENDING":
    default:
      return {
        label: "Verification Pending",
        description: "Our compliance team has not yet completed verification.",
        tone: "warning",
      };
  }
}
