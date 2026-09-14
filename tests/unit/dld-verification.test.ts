import { describe, it, expect } from "vitest";
import { describeVerification } from "@/server/dld/verification";

describe("DLD verification labeling (compliance guardrail)", () => {
  it("never claims official government affiliation for platform-only verification", () => {
    const display = describeVerification("PLATFORM_VERIFIED", new Date());
    expect(display.label).toBe("Platform Verified");
    expect(display.label.toLowerCase()).not.toContain("official dld");
    expect(display.description.toLowerCase()).toContain("not an official dld verification");
  });

  it("only labels OFFICIAL_SOURCE_VERIFIED as verified against the official DLD source", () => {
    const display = describeVerification("OFFICIAL_SOURCE_VERIFIED", new Date());
    expect(display.label).toBe("Verified against official DLD source");
    expect(display.tone).toBe("success");
  });

  it("shows Verification Pending for unverified records", () => {
    const display = describeVerification("PENDING", null);
    expect(display.label).toBe("Verification Pending");
    expect(display.tone).toBe("warning");
  });

  it("flags expired and rejected verifications distinctly", () => {
    expect(describeVerification("EXPIRED", new Date()).tone).toBe("danger");
    expect(describeVerification("REJECTED", new Date()).tone).toBe("danger");
  });
});
