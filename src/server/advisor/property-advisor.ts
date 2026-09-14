import type { Property } from "@prisma/client";
import { rankProperties, type MatchRequest, type MatchResult } from "@/server/matching/engine";

export interface PropertyAdvice extends MatchResult {
  estimatedAnnualRentalIncome: number | null;
  estimatedYieldPercent: number | null;
  riskNotes: string[];
  paymentGuidance: string;
}

export interface AreaComparison {
  community: string;
  averagePrice: number;
  averageYield: number | null;
  listingCount: number;
}

/**
 * AI Property Advisor — deterministic, not a call to an external model (no
 * LLM API key is configured; see docs/DLD-COMPLIANCE.md-style honesty rule
 * applied to every "AI" feature in this codebase). Combines the existing
 * matching engine with real, computed figures from listing data — never
 * fabricates numbers the data doesn't support.
 */
function buildRiskNotes(property: Property, request: MatchRequest): string[] {
  const notes: string[] = [];

  if (property.purpose === "OFF_PLAN") {
    notes.push("Off-plan property: construction and handover timeline risk applies.");
  }
  if (property.serviceCharge && Number(property.serviceCharge) / Number(property.price) > 0.02) {
    notes.push("Service charges are relatively high relative to the purchase price.");
  }
  if (request.minimumYield && property.rentalYield && property.rentalYield < request.minimumYield) {
    notes.push(`Estimated yield (${property.rentalYield}%) is below your target of ${request.minimumYield}%.`);
  }
  if (property.verificationStatus === "PENDING") {
    notes.push("This listing has not yet completed platform verification.");
  }
  if (notes.length === 0) {
    notes.push("No elevated risk factors identified from the listed data.");
  }
  return notes;
}

function buildPaymentGuidance(property: Property): string {
  if (property.paymentPlan) {
    return `Developer payment plan: ${property.paymentPlan}.`;
  }
  return "Standard UAE mortgage lending typically requires at least a 20% down payment for expatriate buyers (25% for properties over AED 5M) — confirm exact terms with your lender.";
}

export function adviseOnProperties(properties: Property[], request: MatchRequest, limit = 5): PropertyAdvice[] {
  const ranked = rankProperties(properties, request).slice(0, limit);

  return ranked.map((result) => {
    const price = Number(result.property.price);
    const estimatedAnnualRentalIncome = result.property.rentalPrice
      ? Number(result.property.rentalPrice)
      : result.property.rentalYield
        ? Math.round(price * (result.property.rentalYield / 100))
        : null;

    return {
      ...result,
      estimatedAnnualRentalIncome,
      estimatedYieldPercent: result.property.rentalYield,
      riskNotes: buildRiskNotes(result.property, request),
      paymentGuidance: buildPaymentGuidance(result.property),
    };
  });
}

export function compareAreas(properties: Property[]): AreaComparison[] {
  const byCommunity = new Map<string, Property[]>();
  for (const property of properties) {
    const key = property.community ?? property.city;
    byCommunity.set(key, [...(byCommunity.get(key) ?? []), property]);
  }

  return Array.from(byCommunity.entries())
    .map(([community, items]) => {
      const prices = items.map((p) => Number(p.price));
      const yields = items.map((p) => p.rentalYield).filter((y): y is number => y !== null);
      return {
        community,
        averagePrice: Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length),
        averageYield: yields.length > 0 ? Math.round((yields.reduce((sum, y) => sum + y, 0) / yields.length) * 10) / 10 : null,
        listingCount: items.length,
      };
    })
    .sort((a, b) => b.listingCount - a.listingCount);
}
