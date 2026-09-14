import { describe, it, expect } from "vitest";
import { rankProperties } from "@/server/matching/engine";
import type { Property } from "@prisma/client";

function makeProperty(overrides: Partial<Property>): Property {
  return {
    id: overrides.id ?? "prop-1",
    slug: "demo-property",
    title: "Demo Property",
    description: null,
    purpose: "INVESTMENT",
    propertyType: "APARTMENT",
    status: "PUBLISHED",
    price: 2500000 as unknown as Property["price"],
    rentalPrice: null,
    sizeSqft: 1000,
    bedrooms: 2,
    bathrooms: 2,
    furnishing: null,
    completionStatus: "Ready",
    community: "Dubai Marina",
    building: null,
    city: "Dubai",
    latitude: null,
    longitude: null,
    developerName: null,
    completionDate: null,
    serviceCharge: null,
    rentalYield: 6.5,
    roi: null,
    paymentPlan: null,
    amenities: [],
    view: null,
    parkingSpaces: null,
    verificationStatus: "PLATFORM_VERIFIED",
    partnerId: null,
    brokerId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Property;
}

describe("deterministic matching engine", () => {
  it("ranks a closer budget/location/bedroom match higher", () => {
    const exactMatch = makeProperty({
      id: "exact",
      price: 2500000 as unknown as Property["price"],
      community: "Dubai Marina",
      bedrooms: 2,
      rentalYield: 6.5,
    });
    const poorMatch = makeProperty({
      id: "poor",
      price: 6000000 as unknown as Property["price"],
      community: "Downtown Dubai",
      bedrooms: 4,
      rentalYield: 2,
    });

    const results = rankProperties([poorMatch, exactMatch], {
      budget: 2500000,
      purpose: "INVESTMENT",
      locations: ["Dubai Marina"],
      bedrooms: 2,
      minimumYield: 6,
    });

    expect(results[0]?.property.id).toBe("exact");
    expect(results[0]?.matchScore).toBeGreaterThan(results[1]?.matchScore ?? 0);
    expect(results[0]?.matchScore).toBeLessThanOrEqual(100);
  });

  it("is deterministic across repeated calls with the same input", () => {
    const property = makeProperty({});
    const request = { budget: 2500000, bedrooms: 2, locations: ["Dubai Marina"] };

    const first = rankProperties([property], request);
    const second = rankProperties([property], request);

    expect(first[0]?.matchScore).toBe(second[0]?.matchScore);
    expect(first[0]?.reasons).toEqual(second[0]?.reasons);
  });

  it("never exceeds a matchScore of 100", () => {
    const property = makeProperty({});
    const results = rankProperties([property], {
      budget: 2500000,
      purpose: "INVESTMENT",
      locations: ["Dubai Marina"],
      bedrooms: 2,
      minimumYield: 5,
    });
    expect(results[0]?.matchScore).toBeLessThanOrEqual(100);
  });
});
