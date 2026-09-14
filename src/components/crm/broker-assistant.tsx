"use client";

import { useState } from "react";
import Link from "next/link";
import { Input, FormError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatAed } from "@/lib/utils/format";

interface Client { id: string; name: string; budget: string | null; preferredLocations: string[] }
interface PropertyResult { id: string; slug: string; title: string; price: string; bedrooms: number | null; community: string | null }

export function BrokerAssistant() {
  const [query, setQuery] = useState("");
  const [clients, setClients] = useState<Client[] | null>(null);
  const [properties, setProperties] = useState<PropertyResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/assistant/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error?.message ?? "Could not run that query");
      return;
    }
    setClients(json.data.clients);
    setProperties(json.data.properties);
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Try: "2 bedroom under 1.8M in JVC"'
            className="flex-1"
          />
          <Button type="submit" disabled={loading}>{loading ? "Searching…" : "Ask Assistant"}</Button>
        </form>
        <FormError>{error}</FormError>
        <p className="mt-2 text-xs text-charcoal/50">
          A structured search over your own clients and listings — parses bedrooms, budget, and area from your question.
        </p>
      </Card>

      {clients && (
        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold text-charcoal">Matching Clients ({clients.length})</h2>
          {clients.length === 0 ? (
            <p className="mt-3 text-sm text-charcoal/50">No matching clients.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {clients.map((client) => (
                <li key={client.id} className="flex items-center justify-between border-b border-charcoal/5 py-2 last:border-0">
                  <Link href={`/partner/dashboard/clients/${client.id}`} className="focus-ring text-charcoal hover:text-champagne-dark">
                    {client.name}
                  </Link>
                  <span className="text-charcoal/50">{client.budget ? formatAed(client.budget) : "—"}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {properties && (
        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold text-charcoal">Matching Properties ({properties.length})</h2>
          {properties.length === 0 ? (
            <p className="mt-3 text-sm text-charcoal/50">No matching properties in your inventory.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {properties.map((property) => (
                <li key={property.id} className="flex items-center justify-between border-b border-charcoal/5 py-2 last:border-0">
                  <span className="text-charcoal">{property.title}</span>
                  <span className="text-charcoal/50">{formatAed(property.price)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
