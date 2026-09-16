"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Label, FormError, Select, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface CandidateBroker {
  id: string;
  name: string;
}

export function CreateSplitForm({ commissionId, remainingPercent }: { commissionId: string; remainingPercent: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [brokers, setBrokers] = useState<CandidateBroker[]>([]);
  const [brokerId, setBrokerId] = useState("");
  const [percent, setPercent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || brokers.length > 0) return;
    fetch("/api/commissions/splits/candidate-brokers")
      .then((res) => res.json())
      .then((json) => {
        if (json?.data) {
          setBrokers(json.data);
          if (json.data[0]) setBrokerId(json.data[0].id);
        }
      });
  }, [open, brokers.length]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/commissions/${commissionId}/splits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brokerId, percent }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(json.error?.message ?? "Could not create split");
      return;
    }
    setPercent("");
    setOpen(false);
    router.refresh();
  }

  if (remainingPercent <= 0) {
    return <p className="text-xs text-charcoal/50">This commission is fully allocated.</p>;
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm">
        Add Split
      </Button>
    );
  }

  return (
    <Card className="p-5">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div className="min-w-[180px] flex-1">
          <Label htmlFor="splitBrokerId">Broker</Label>
          <Select id="splitBrokerId" required value={brokerId} onChange={(e) => setBrokerId(e.target.value)}>
            <option value="" disabled>
              {brokers.length === 0 ? "Loading brokers…" : "Select a broker"}
            </option>
            {brokers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="splitPercent">Percent (up to {remainingPercent.toFixed(2)}% remaining)</Label>
          <Input
            id="splitPercent"
            type="number"
            min={0}
            max={remainingPercent}
            step="0.01"
            required
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
          />
        </div>
        <Button type="submit" size="sm" disabled={submitting || !brokerId || !percent}>
          {submitting ? "Adding…" : "Add split"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </form>
      <FormError>{error}</FormError>
    </Card>
  );
}
