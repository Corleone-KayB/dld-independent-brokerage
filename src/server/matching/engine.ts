import type { Property, PropertyPurpose } from "@prisma/client";

export interface MatchRequest {
  budget?: number;
  purpose?: PropertyPurpose;
  locations?: string[];
  bedrooms?: number;
  minimumYield?: number;
  completionStatus?: string;
}

export interface MatchResult {
  property: Property;
  matchScore: number;
  reasons: string[];
}

/**
 * Deterministic weighted scoring, isolated so an AI/ML matcher can replace
 * it later without changing callers. Weights sum to 100.
 */
const WEIGHTS = {
  budget: 30,
  location: 25,
  bedrooms: 20,
  purpose: 15,
  yield: 10,
};

export function scoreProperty(property: Property, request: MatchRequest): MatchResult {
  let score = 0;
  const reasons: string[] = [];

  if (request.budget) {
    const price = Number(property.price);
    const diff = Math.abs(price - request.budget) / request.budget;
    if (diff <= 0.05) {
      score += WEIGHTS.budget;
      reasons.push("Within 5% of your target budget");
    } else if (diff <= 0.15) {
      score += WEIGHTS.budget * 0.7;
      reasons.push("Close to your target budget");
    } else if (diff <= 0.3) {
      score += WEIGHTS.budget * 0.35;
      reasons.push("Within a reasonable budget range");
    }
  } else {
    score += WEIGHTS.budget * 0.5;
  }

  if (request.locations && request.locations.length > 0) {
    const propertyLocation = `${property.community ?? ""} ${property.city}`.toLowerCase();
    const matchedLocation = request.locations.find((loc) =>
      propertyLocation.includes(loc.toLowerCase()),
    );
    if (matchedLocation) {
      score += WEIGHTS.location;
      reasons.push(`Located in ${property.community ?? property.city}, a preferred area`);
    }
  } else {
    score += WEIGHTS.location * 0.5;
  }

  if (request.bedrooms !== undefined) {
    if (property.bedrooms === request.bedrooms) {
      score += WEIGHTS.bedrooms;
      reasons.push(`Matches your requested ${request.bedrooms}-bedroom layout`);
    } else if (
      property.bedrooms !== null &&
      Math.abs(property.bedrooms - request.bedrooms) === 1
    ) {
      score += WEIGHTS.bedrooms * 0.5;
      reasons.push("Close to your requested bedroom count");
    }
  } else {
    score += WEIGHTS.bedrooms * 0.5;
  }

  if (request.purpose) {
    if (property.purpose === request.purpose) {
      score += WEIGHTS.purpose;
      reasons.push(`Matches your ${request.purpose.toLowerCase()} objective`);
    }
  } else {
    score += WEIGHTS.purpose * 0.5;
  }

  if (request.minimumYield !== undefined) {
    if (property.rentalYield !== null && property.rentalYield >= request.minimumYield) {
      score += WEIGHTS.yield;
      reasons.push(`Estimated yield of ${property.rentalYield}% meets your minimum`);
    }
  } else {
    score += WEIGHTS.yield * 0.5;
  }

  if (
    request.completionStatus &&
    property.completionStatus &&
    property.completionStatus.toLowerCase() === request.completionStatus.toLowerCase()
  ) {
    reasons.push(`Completion status matches: ${property.completionStatus}`);
  }

  return {
    property,
    matchScore: Math.round(Math.min(100, score)),
    reasons,
  };
}

export function rankProperties(properties: Property[], request: MatchRequest): MatchResult[] {
  return properties
    .map((property) => scoreProperty(property, request))
    .sort((a, b) => b.matchScore - a.matchScore);
}
