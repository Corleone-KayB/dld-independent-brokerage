"use client";

import { useState } from "react";
import Link from "next/link";
import { Input, Label, Select, FormError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatAed } from "@/lib/utils/format";
import { COMMUNITIES, PROPERTY_PURPOSE_LABELS } from "@/lib/constants";

interface AdviceResult {
  property: { id: string; slug: string; title: string; price: string; community: string | null; city: string };
  matchScore: number;
  reasons: string[];
  estimatedAnnualRentalIncome: number | null;
  estimatedYieldPercent: number | null;
  riskNotes: string[];
  paymentGuidance: string;
}

export function PropertyAdvisorForm() {
  const [form, setForm] = useState({ budget: "", purpose: "INVESTMENT", community: "", bedrooms: "", minimumYield: "" });
  const [results, setResults] = useState<AdviceResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/advisor/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        budget: form.budget ? Number(form.budget) : undefined,
        purpose: form.purpose,
        locations: form.community ? [form.community] : [],
        bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
        minimumYield: form.minimumYield ? Number(form.minimumYield) : undefined,
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error?.message ?? "Something went wrong");
      return;
    }
    setResults(json.data.advice);
  }

  return (
    <div>
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <Label htmlFor="budget">Budget (AED)</Label>
            <Input id="budget" type="number" min={0} value={form.budget} onChange={(e) => update("budget", e.target.value)} placeholder="2500000" />
          </div>
          <div>
            <Label htmlFor="purpose">Purpose</Label>
            <Select id="purpose" value={form.purpose} onChange={(e) => update("purpose", e.target.value)}>
              {Object.entries(PROPERTY_PURPOSE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="community">Preferred area</Label>
            <Select id="community" value={form.community} onChange={(e) => update("community", e.target.value)}>
              <option value="">Any</option>
              {COMMUNITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="bedrooms">Bedrooms</Label>
            <Input id="bedrooms" type="number" min={0} value={form.bedrooms} onChange={(e) => update("bedrooms", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="minimumYield">Minimum yield (%)</Label>
            <Input id="minimumYield" type="number" min={0} value={form.minimumYield} onChange={(e) => update("minimumYield", e.target.value)} placeholder="6" />
          </div>
          <div className="sm:col-span-2 lg:col-span-5">
            <FormError>{error}</FormError>
            <Button type="submit" disabled={loading}>{loading ? "Analyzing…" : "Get Recommendations"}</Button>
          </div>
        </form>
      </Card>

      {results && (
        <div className="mt-8 space-y-4">
          <p className="text-xs text-charcoal/50">
            Calculated from listed property data — not financial advice. Figures are estimates only.
          </p>
          {results.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-charcoal/20 p-8 text-center text-charcoal/50">
              No matching properties found. Try adjusting your criteria.
            </p>
          ) : (
            results.map((advice) => (
              <Card key={advice.property.id} className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link href={`/properties/${advice.property.slug}`} className="focus-ring font-display text-lg font-semibold text-charcoal hover:text-champagne-dark">
                      {advice.property.title}
                    </Link>
                    <p className="text-sm text-charcoal/60">{advice.property.community ?? advice.property.city} · {formatAed(advice.property.price)}</p>
                  </div>
                  <Badge tone="champagne">{advice.matchScore}% match</Badge>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-charcoal/50">Est. Annual Rental Income</p>
                    <p className="mt-1 font-medium text-charcoal">
                      {advice.estimatedAnnualRentalIncome ? formatAed(advice.estimatedAnnualRentalIncome) : "Insufficient data"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-charcoal/50">Est. Yield</p>
                    <p className="mt-1 font-medium text-charcoal">
                      {advice.estimatedYieldPercent ? `${advice.estimatedYieldPercent}%` : "Insufficient data"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-charcoal/50">Payment</p>
                    <p className="mt-1 text-xs text-charcoal/70">{advice.paymentGuidance}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xs uppercase tracking-wide text-charcoal/50">Why this match</p>
                  <ul className="mt-1 list-inside list-disc text-sm text-charcoal/70">
                    {advice.reasons.map((reason) => <li key={reason}>{reason}</li>)}
                  </ul>
                </div>

                <div className="mt-4">
                  <p className="text-xs uppercase tracking-wide text-charcoal/50">Risk notes</p>
                  <ul className="mt-1 list-inside list-disc text-sm text-charcoal/70">
                    {advice.riskNotes.map((note) => <li key={note}>{note}</li>)}
                  </ul>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
