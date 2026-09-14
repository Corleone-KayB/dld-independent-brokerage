import { describe, it, expect } from "vitest";
import { computeLeadScore } from "@/server/matching/lead-scoring";

describe("AI Lead Scoring (deterministic)", () => {
  it("classifies a rich, urgent lead as HOT", () => {
    const result = computeLeadScore({
      hasBudget: true,
      hasClient: true,
      hasProperty: true,
      message: "I need this ASAP, ready to buy this week.",
      source: "WhatsApp",
    });
    expect(result.temperature).toBe("HOT");
    expect(result.score).toBeGreaterThanOrEqual(65);
  });

  it("classifies a bare lead with nothing attached as COLD", () => {
    const result = computeLeadScore({ hasBudget: false, hasClient: false, hasProperty: false });
    expect(result.temperature).toBe("COLD");
    expect(result.score).toBeLessThan(35);
  });

  it("classifies a moderately-detailed lead as WARM", () => {
    const result = computeLeadScore({ hasBudget: true, hasClient: true, hasProperty: false, message: "Interested" });
    expect(result.temperature).toBe("WARM");
  });

  it("never produces a score outside 0-100", () => {
    const result = computeLeadScore({
      hasBudget: true,
      hasClient: true,
      hasProperty: true,
      message: "asap urgent today ready to buy",
      source: "whatsapp referral direct",
    });
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it("is deterministic across repeated calls with the same input", () => {
    const input = { hasBudget: true, hasClient: false, hasProperty: true, message: "urgent", source: "Website" };
    expect(computeLeadScore(input)).toEqual(computeLeadScore(input));
  });
});
