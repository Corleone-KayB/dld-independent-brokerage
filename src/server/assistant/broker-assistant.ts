import "server-only";
import { prisma } from "@/server/db/client";
import { COMMUNITIES } from "@/lib/constants";

export interface ParsedBrokerQuery {
  bedrooms: number | null;
  maxBudget: number | null;
  community: string | null;
  raw: string;
}

/**
 * AI Broker Assistant — deterministic structured-search parser, not a call
 * to an external model (no LLM API key configured; same honesty stance as
 * every other "AI" feature in this codebase). Extracts bedrooms/budget/area
 * from a free-text query with simple, transparent regex rules so a query
 * like the spec's example ("Find my clients looking for 2-bedroom
 * properties under AED 1.8M") works, without pretending to be a trained
 * language model.
 */
export function parseBrokerQuery(text: string): ParsedBrokerQuery {
  const lower = text.toLowerCase();

  const bedroomsMatch = lower.match(/(\d+)\s*[- ]?\s*(bed|bedroom|br)\b/);
  const bedrooms = bedroomsMatch ? Number(bedroomsMatch[1]) : null;

  // Only treat a number as a budget ceiling when a ceiling keyword directly precedes it —
  // otherwise the first unrelated number in the query (e.g. "2-bedroom") would be misread as a budget.
  const budgetMatch = lower.match(/(?:under|below|up to|less than)\s*(?:aed\s*)?(\d+(?:\.\d+)?)\s*(m|million|k|thousand)?/);
  let maxBudget: number | null = null;
  if (budgetMatch) {
    const value = Number(budgetMatch[1]);
    const unit = budgetMatch[2];
    maxBudget = unit === "m" || unit === "million" ? value * 1_000_000 : unit === "k" || unit === "thousand" ? value * 1_000 : value;
  }

  const community = COMMUNITIES.find((c) => lower.includes(c.toLowerCase())) ?? null;

  return { bedrooms, maxBudget, community, raw: text };
}

export async function runBrokerQuery(partnerId: string, query: ParsedBrokerQuery) {
  const [clients, properties] = await Promise.all([
    prisma.client.findMany({
      where: {
        partnerId,
        ...(query.maxBudget ? { budget: { lte: query.maxBudget } } : {}),
        ...(query.community ? { preferredLocations: { has: query.community } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.property.findMany({
      where: {
        partnerId,
        ...(query.bedrooms ? { bedrooms: query.bedrooms } : {}),
        ...(query.maxBudget ? { price: { lte: query.maxBudget } } : {}),
        ...(query.community ? { community: { contains: query.community, mode: "insensitive" } } : {}),
      },
      include: { images: { take: 1 } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return { clients, properties };
}
