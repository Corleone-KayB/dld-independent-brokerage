import { describe, it, expect } from "vitest";
import { adviseOnProperties, compareAreas } from "@/server/advisor/property-advisor";
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
    projectId: null,
    ownerName: null,
    ownerEmail: null,
    ownerPhone: null,
    matchRequested: false,
    seoTitle: null,
    seoDescription: null,
    viewCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Property;
}

describe("AI Property Advisor (deterministic)", () => {
  it("estimates annual rental income from yield when no explicit rental price is set", () => {
    const property = makeProperty({ price: 2500000 as unknown as Property["price"], rentalYield: 6 });
    const [advice] = adviseOnProperties([property], { budget: 2500000 }) as [NonNullable<ReturnType<typeof adviseOnProperties>[number]>];
    expect(advice.estimatedAnnualRentalIncome).toBe(150000);
  });

  it("prefers an explicit rental price over a yield-derived estimate", () => {
    const property = makeProperty({ rentalPrice: 200000 as unknown as Property["rentalPrice"], rentalYield: 6 });
    const [advice] = adviseOnProperties([property], {}) as [NonNullable<ReturnType<typeof adviseOnProperties>[number]>];
    expect(advice.estimatedAnnualRentalIncome).toBe(200000);
  });

  it("reports insufficient data (null) rather than fabricating a rental estimate", () => {
    const property = makeProperty({ rentalPrice: null, rentalYield: null });
    const [advice] = adviseOnProperties([property], {}) as [NonNullable<ReturnType<typeof adviseOnProperties>[number]>];
    expect(advice.estimatedAnnualRentalIncome).toBeNull();
  });

  it("flags off-plan and below-target-yield risk notes from real listing data", () => {
    const property = makeProperty({ purpose: "OFF_PLAN", rentalYield: 3 });
    const [advice] = adviseOnProperties([property], { minimumYield: 6 }) as [NonNullable<ReturnType<typeof adviseOnProperties>[number]>];
    expect(advice.riskNotes.some((n) => n.includes("Off-plan"))).toBe(true);
    expect(advice.riskNotes.some((n) => n.includes("below your target"))).toBe(true);
  });

  it("compares areas using only real computed averages, sorted by listing count", () => {
    const marina1 = makeProperty({ id: "m1", community: "Dubai Marina", price: 2000000 as unknown as Property["price"], rentalYield: 6 });
    const marina2 = makeProperty({ id: "m2", community: "Dubai Marina", price: 3000000 as unknown as Property["price"], rentalYield: 8 });
    const jvc = makeProperty({ id: "j1", community: "JVC", price: 900000 as unknown as Property["price"], rentalYield: 7 });

    const comparison = compareAreas([marina1, marina2, jvc]);
    const marinaStats = comparison.find((c) => c.community === "Dubai Marina");

    expect(marinaStats?.averagePrice).toBe(2500000);
    expect(marinaStats?.averageYield).toBe(7);
    expect(comparison[0]?.community).toBe("Dubai Marina");
  });
});
