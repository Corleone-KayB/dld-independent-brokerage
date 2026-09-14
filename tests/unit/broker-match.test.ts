import { describe, it, expect } from "vitest";
import { rankBrokerMatches } from "@/server/matching/broker-match";
import type { Broker } from "@prisma/client";

function makeBroker(overrides: Partial<Broker>): Broker {
  return {
    id: overrides.id ?? "broker-1",
    userId: "user-1",
    partnerId: null,
    slug: "demo-broker",
    name: "Demo Broker",
    photoUrl: null,
    bio: null,
    languages: [],
    specializations: [],
    areasServed: [],
    experienceYears: null,
    brokerNumber: null,
    orn: null,
    verificationStatus: "PENDING",
    officialVerificationUrl: null,
    lastVerifiedAt: null,
    rating: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Broker;
}

describe("deterministic broker matching (Property Owner Portal / Lead Distribution)", () => {
  it("ranks a broker who serves the requested area and specialization above one who doesn't", () => {
    const goodMatch = makeBroker({
      id: "good",
      areasServed: ["Dubai Marina"],
      specializations: ["Leasing"],
      verificationStatus: "PLATFORM_VERIFIED",
    });
    const poorMatch = makeBroker({ id: "poor", areasServed: ["Downtown Dubai"], specializations: ["Sales"] });

    const results = rankBrokerMatches([poorMatch, goodMatch], {
      community: "Dubai Marina",
      specialization: "Leasing",
    });

    expect(results[0]?.broker.id).toBe("good");
    expect(results[0]?.score).toBeGreaterThan(results[1]?.score ?? 0);
    expect(results[0]?.reasons).toContain("Serves Dubai Marina");
  });

  it("never exceeds a score of 100 and is deterministic across calls", () => {
    const broker = makeBroker({ areasServed: ["JVC"], specializations: ["Sales"], verificationStatus: "PLATFORM_VERIFIED", rating: 5 });
    const request = { community: "JVC", specialization: "Sales" };

    const first = rankBrokerMatches([broker], request);
    const second = rankBrokerMatches([broker], request);

    expect(first[0]?.score).toBeLessThanOrEqual(100);
    expect(first[0]?.score).toBe(second[0]?.score);
  });

  it("gives unverified brokers a lower score than verified ones, all else equal", () => {
    const verified = makeBroker({ id: "v", areasServed: ["JVC"], verificationStatus: "PLATFORM_VERIFIED" });
    const unverified = makeBroker({ id: "u", areasServed: ["JVC"], verificationStatus: "PENDING" });

    const results = rankBrokerMatches([unverified, verified], { community: "JVC" });
    const verifiedResult = results.find((r) => r.broker.id === "v");
    const unverifiedResult = results.find((r) => r.broker.id === "u");

    expect(verifiedResult!.score).toBeGreaterThan(unverifiedResult!.score);
  });
});
