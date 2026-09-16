import "server-only";

/**
 * Anti-abuse rate limiting for the Phase 3 network features that
 * deliberately don't require a prior connection (referrals, deal-
 * collaboration invites, listing/lead shares — see docs/ARCHITECTURE.md).
 * A DB-backed sliding-window count, not a new infra dependency (no Redis) —
 * consistent with this codebase's "no new dependency unless genuinely
 * required" precedent from Phase 2.
 */
export class RateLimitError extends Error {
  status = 429;
  constructor(message = "Rate limit exceeded") {
    super(message);
    this.name = "RateLimitError";
  }
}

/** Defaults are stated implementation assumptions (see Phase 3 plan) — easy to tune later without a schema change. */
export const RATE_LIMITS = {
  REFERRALS_PER_DAY: 20,
  REFERRALS_TO_SAME_BROKER_PER_DAY: 5,
  COLLAB_INVITES_PER_DAY: 20,
  PROPERTY_SHARES_PER_DAY: 30,
  CONNECTION_REQUESTS_PER_DAY: 20,
} as const;

export function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

/**
 * Throws RateLimitError if `count()` (a caller-supplied, already-scoped and
 * already-windowed Prisma count query) is at or above `max`. Kept as a thin
 * callback wrapper — rather than one "generic Prisma model" function — so
 * each call site keeps full type safety on its own count query.
 */
export async function enforceRateLimit(input: {
  count: () => Promise<number>;
  max: number;
  action: string;
}): Promise<void> {
  const current = await input.count();
  if (current >= input.max) {
    throw new RateLimitError(`Rate limit exceeded for ${input.action}: max ${input.max} per 24h`);
  }
}
