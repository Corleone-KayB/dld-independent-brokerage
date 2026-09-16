import { describe, it, expect } from "vitest";
import { enforceRateLimit, RateLimitError, hoursAgo, RATE_LIMITS } from "@/server/security/rate-limit";

describe("anti-abuse rate limiting (Phase 3 — referrals/collaboration/sharing need no prior connection)", () => {
  it("allows the action when the count is below the max", async () => {
    await expect(
      enforceRateLimit({ count: async () => 5, max: RATE_LIMITS.REFERRALS_PER_DAY, action: "test" }),
    ).resolves.toBeUndefined();
  });

  it("throws RateLimitError once the count reaches the max", async () => {
    await expect(
      enforceRateLimit({ count: async () => RATE_LIMITS.REFERRALS_PER_DAY, action: "test" , max: RATE_LIMITS.REFERRALS_PER_DAY }),
    ).rejects.toThrow(RateLimitError);
  });

  it("throws RateLimitError when the count exceeds the max", async () => {
    await expect(
      enforceRateLimit({ count: async () => RATE_LIMITS.REFERRALS_PER_DAY + 1, max: RATE_LIMITS.REFERRALS_PER_DAY, action: "test" }),
    ).rejects.toThrow(RateLimitError);
  });

  it("RateLimitError carries a 429 status for the shared error-response mapper", () => {
    const error = new RateLimitError("too many");
    expect(error.status).toBe(429);
    expect(error.name).toBe("RateLimitError");
  });

  it("hoursAgo returns a timestamp in the past by the given number of hours", () => {
    const now = Date.now();
    const past = hoursAgo(24).getTime();
    expect(past).toBeLessThan(now);
    expect(now - past).toBeGreaterThanOrEqual(24 * 60 * 60 * 1000 - 1000);
  });
});
