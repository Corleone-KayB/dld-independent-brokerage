"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Label, Select, Textarea, FormError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function NewLeadForm({ clients }: { clients: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [budget, setBudget] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: clientId || undefined, budget: budget || undefined, message }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(json.error?.message ?? "Could not create lead");
      return;
    }
    setMessage("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm">
        Add lead
      </Button>
    );
  }

  return (
    <Card className="p-5">
      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="clientId">Client</Label>
          <Select id="clientId" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">Unassigned</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="budget">Budget (AED)</Label>
          <Input id="budget" type="number" min={0} value={budget} onChange={(e) => setBudget(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="message">Message</Label>
          <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
        <p className="text-xs text-charcoal/50 sm:col-span-2">
          Lead score and temperature are calculated automatically, and the
          lead is routed to the best-fit available broker on your team.
        </p>
        <div className="sm:col-span-2">
          <FormError>{error}</FormError>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Saving…" : "Save lead"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
