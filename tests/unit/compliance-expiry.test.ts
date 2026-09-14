import { describe, it, expect } from "vitest";
import { documentExpiryState } from "@/modules/compliance/service";

describe("compliance document expiry state", () => {
  it("returns none when there is no expiry date", () => {
    expect(documentExpiryState(null)).toBe("none");
  });

  it("returns expired for a past date", () => {
    expect(documentExpiryState(new Date(Date.now() - 24 * 60 * 60 * 1000))).toBe("expired");
  });

  it("returns expiring within the 30-day alert window", () => {
    expect(documentExpiryState(new Date(Date.now() + 10 * 24 * 60 * 60 * 1000))).toBe("expiring");
  });

  it("returns valid outside the alert window", () => {
    expect(documentExpiryState(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000))).toBe("valid");
  });
});
