import type { Broker } from "@prisma/client";

export interface BrokerMatchRequest {
  community?: string | null;
  specialization?: string | null;
  minBudget?: number | null;
}

export interface BrokerMatchResult {
  broker: Broker;
  score: number;
  reasons: string[];
}

/**
 * Deterministic weighted scoring for "let us match you with a verified
 * broker" (Property Owner Portal) and broker-eligibility ranking (Lead
 * Distribution Engine). Isolated so an AI/ML matcher can replace it later —
 * same pattern as src/server/matching/engine.ts.
 */
const WEIGHTS = { area: 40, specialization: 35, verification: 15, rating: 10 };

export function scoreBrokerMatch(broker: Broker, request: BrokerMatchRequest): BrokerMatchResult {
  let score = 0;
  const reasons: string[] = [];

  if (request.community) {
    const match = broker.areasServed.some((area) => area.toLowerCase() === request.community!.toLowerCase());
    if (match) {
      score += WEIGHTS.area;
      reasons.push(`Serves ${request.community}`);
    }
  } else {
    score += WEIGHTS.area * 0.5;
  }

  if (request.specialization) {
    const match = broker.specializations.some(
      (s) => s.toLowerCase() === request.specialization!.toLowerCase(),
    );
    if (match) {
      score += WEIGHTS.specialization;
      reasons.push(`Specializes in ${request.specialization}`);
    }
  } else {
    score += WEIGHTS.specialization * 0.5;
  }

  if (broker.verificationStatus === "PLATFORM_VERIFIED" || broker.verificationStatus === "OFFICIAL_SOURCE_VERIFIED") {
    score += WEIGHTS.verification;
    reasons.push("Verified broker");
  }

  if (broker.rating) {
    score += WEIGHTS.rating * Math.min(1, broker.rating / 5);
    if (broker.rating >= 4.5) reasons.push("Highly rated");
  }

  return { broker, score: Math.round(Math.min(100, score)), reasons };
}

export function rankBrokerMatches(brokers: Broker[], request: BrokerMatchRequest): BrokerMatchResult[] {
  return brokers
    .map((broker) => scoreBrokerMatch(broker, request))
    .sort((a, b) => b.score - a.score);
}
