import type { LeadTemperature } from "@prisma/client";

export interface LeadScoringInput {
  hasBudget: boolean;
  hasClient: boolean;
  hasProperty: boolean;
  message?: string | null;
  source?: string | null;
}

const URGENCY_KEYWORDS = ["asap", "urgent", "today", "this week", "immediately", "ready to buy", "ready to move"];

/**
 * AI Lead Scoring (deterministic — see docs/DLD-COMPLIANCE.md-style honesty
 * rule applied to "AI" features: no external model is called, this is a
 * transparent weighted rule engine, same pattern as the property matching
 * and broker matching engines). Factors follow the spec: budget, intent
 * (message content), engagement signals (property/client attached), and
 * source quality.
 */
export function computeLeadScore(input: LeadScoringInput): { score: number; temperature: LeadTemperature } {
  let score = 0;

  if (input.hasBudget) score += 30;
  if (input.hasClient) score += 15;
  if (input.hasProperty) score += 20;

  const message = input.message?.toLowerCase() ?? "";
  if (message.length > 0) score += 10;
  if (URGENCY_KEYWORDS.some((keyword) => message.includes(keyword))) score += 15;

  const source = input.source?.toLowerCase() ?? "";
  if (source.includes("whatsapp") || source.includes("direct") || source.includes("referral")) score += 10;

  score = Math.max(0, Math.min(100, score));

  const temperature: LeadTemperature = score >= 65 ? "HOT" : score >= 35 ? "WARM" : "COLD";
  return { score, temperature };
}
