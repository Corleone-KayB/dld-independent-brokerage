import { env } from "@/lib/env";

/**
 * Tier 1 (official links) + Tier 3/4 (internal + manual verification) per
 * docs/DLD-COMPLIANCE.md. This platform has no authorized Tier 2 API access
 * in the development environment, so it must never claim live DLD data.
 */
export const dldConfig = {
  officialVerificationUrl: env.DLD_OFFICIAL_VERIFICATION_URL,
  officialBrokerDirectoryUrl: env.DLD_OFFICIAL_BROKER_DIRECTORY_URL,
  officialCompanyDirectoryUrl: env.DLD_OFFICIAL_COMPANY_DIRECTORY_URL,
} as const;

export function hasOfficialVerificationLink(): boolean {
  return dldConfig.officialVerificationUrl.trim().length > 0;
}
