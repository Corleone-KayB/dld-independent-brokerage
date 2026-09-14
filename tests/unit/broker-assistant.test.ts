import { describe, it, expect } from "vitest";
import { parseBrokerQuery } from "@/server/assistant/broker-assistant";

describe("Broker Assistant query parser (deterministic, spec's example query)", () => {
  it("parses the spec's worked example: 'Find my clients looking for 2-bedroom properties under AED 1.8M'", () => {
    const result = parseBrokerQuery("Find my clients looking for 2-bedroom properties under AED 1.8M");
    expect(result.bedrooms).toBe(2);
    expect(result.maxBudget).toBe(1_800_000);
  });

  it("parses a plain 'under 900k' budget in thousands", () => {
    const result = parseBrokerQuery("Studio under 900k in Business Bay");
    expect(result.maxBudget).toBe(900_000);
  });

  it("extracts a known community name when mentioned", () => {
    const result = parseBrokerQuery("3 bedroom villa in Arabian Ranches");
    expect(result.community).toBe("Arabian Ranches");
  });

  it("returns nulls for fields it cannot confidently extract, rather than guessing", () => {
    const result = parseBrokerQuery("Something vague");
    expect(result.bedrooms).toBeNull();
    expect(result.maxBudget).toBeNull();
    expect(result.community).toBeNull();
  });

  it("does not treat a bare number without 'under/below' as a budget ceiling", () => {
    const result = parseBrokerQuery("2 bedroom in JVC, budget flexible");
    expect(result.maxBudget).toBeNull();
  });
});
