import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "@/server/db/client";
import { getAnalyticsOverview } from "@/modules/analytics/service";
import { rankBrokerPerformance } from "@/server/analytics/broker-performance";
import { recordPropertyView } from "@/modules/properties/service";

describe("Advanced Analytics + Broker Performance Ranking integration (requires local Postgres + seed data)", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns a full analytics overview aggregated from real data", async () => {
    const overview = await getAnalyticsOverview();
    expect(overview.totalLeads).toBeGreaterThanOrEqual(0);
    expect(overview.leadsBySource.length).toBeGreaterThanOrEqual(0);
    expect(overview.communityPerformance.length).toBeGreaterThan(0);
    expect(overview.revenue).toBeGreaterThanOrEqual(0);
  });

  it("ranks brokers with a bounded, deterministic performance score", async () => {
    const ranking = await rankBrokerPerformance();
    expect(ranking.length).toBeGreaterThan(0);
    for (const broker of ranking) {
      expect(broker.performanceScore).toBeGreaterThanOrEqual(0);
      expect(broker.performanceScore).toBeLessThanOrEqual(100);
    }
    // sorted descending
    for (let i = 1; i < ranking.length; i++) {
      expect(ranking[i - 1]!.performanceScore).toBeGreaterThanOrEqual(ranking[i]!.performanceScore);
    }
  });

  it("recordPropertyView increments the view counter and logs an enquiry", async () => {
    const property = await prisma.property.findFirstOrThrow({ where: { status: "PUBLISHED" } });
    const before = property.viewCount;

    recordPropertyView(property.id, property.brokerId);

    // recordPropertyView is fire-and-forget; poll instead of a fixed sleep
    // so this isn't flaky under the heavier concurrency of a full test run.
    let log = null;
    for (let attempt = 0; attempt < 20 && !log; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      log = await prisma.enquiryLog.findFirst({
        where: { propertyId: property.id, type: "PROPERTY_VIEW" },
        orderBy: { createdAt: "desc" },
      });
    }
    expect(log).not.toBeNull();

    const after = await prisma.property.findUniqueOrThrow({ where: { id: property.id } });
    expect(after.viewCount).toBe(before + 1);
  });
});
