import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "@/server/db/client";
import { submitOwnerListing } from "@/modules/properties/service";
import { ownerListingSchema } from "@/lib/validations/property";

describe("Property Owner Portal integration (requires local Postgres + seed data)", () => {
  const createdIds: string[] = [];

  afterAll(async () => {
    await prisma.property.deleteMany({ where: { id: { in: createdIds } } });
    await prisma.$disconnect();
  });

  it("creates a DRAFT listing with owner contact details and no partner yet", async () => {
    const input = ownerListingSchema.parse({
      ownerName: "Test Owner",
      ownerEmail: "test-owner@example.com",
      ownerPhone: "+971500000123",
      purpose: "BUY",
      propertyType: "APARTMENT",
      price: 1200000,
      bedrooms: 2,
      community: "Dubai Marina",
      matchRequested: false,
    });

    const property = await submitOwnerListing(input);
    createdIds.push(property.id);

    expect(property.status).toBe("DRAFT");
    expect(property.partnerId).toBeNull();
    expect(property.ownerEmail).toBe("test-owner@example.com");
    expect(property.matchRequested).toBe(false);
    expect(property.brokerId).toBeNull();
  });

  it("auto-suggests a verified broker serving the requested area when matchRequested is true", async () => {
    const input = ownerListingSchema.parse({
      ownerName: "Test Owner 2",
      ownerEmail: "test-owner-2@example.com",
      ownerPhone: "+971500000124",
      purpose: "RENT",
      propertyType: "VILLA",
      rentalPrice: 200000,
      community: "Dubai Marina",
      matchRequested: true,
    });

    const property = await submitOwnerListing(input);
    createdIds.push(property.id);

    expect(property.brokerId).not.toBeNull();
    const broker = await prisma.broker.findUnique({ where: { id: property.brokerId! } });
    expect(broker?.areasServed).toContain("Dubai Marina");
  });

  it("respects an explicit preferred broker over auto-matching", async () => {
    const broker = await prisma.broker.findFirst();
    const input = ownerListingSchema.parse({
      ownerName: "Test Owner 3",
      ownerEmail: "test-owner-3@example.com",
      ownerPhone: "+971500000125",
      purpose: "BUY",
      propertyType: "APARTMENT",
      price: 900000,
      matchRequested: true,
      preferredBrokerId: broker!.id,
    });

    const property = await submitOwnerListing(input);
    createdIds.push(property.id);

    expect(property.brokerId).toBe(broker!.id);
  });
});
