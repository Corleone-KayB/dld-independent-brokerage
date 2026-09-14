import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "@/server/db/client";
import { searchProperties } from "@/modules/properties/service";
import { propertySearchSchema } from "@/lib/validations/property";

describe("property search integration (requires local Postgres + seed data)", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns only PUBLISHED properties for public search", async () => {
    const result = await searchProperties(propertySearchSchema.parse({ page: 1, pageSize: 20 }), {
      publicOnly: true,
    });
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.every((p) => p.status === "PUBLISHED")).toBe(true);
  });

  it("filters by community", async () => {
    const result = await searchProperties(
      propertySearchSchema.parse({ community: "Dubai Marina", page: 1, pageSize: 20 }),
      { publicOnly: true },
    );
    expect(result.items.every((p) => p.community === "Dubai Marina")).toBe(true);
  });

  it("filters by price range", async () => {
    const result = await searchProperties(
      propertySearchSchema.parse({ minPrice: 5000000, page: 1, pageSize: 20 }),
      { publicOnly: true },
    );
    expect(result.items.every((p) => Number(p.price) >= 5000000)).toBe(true);
  });
});
