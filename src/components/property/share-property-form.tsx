"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Label, FormError, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ReferrableBroker {
  id: string;
  name: string;
}

export function SharePropertyForm({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [brokers, setBrokers] = useState<ReferrableBroker[]>([]);
  const [targetBrokerId, setTargetBrokerId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || brokers.length > 0) return;
    // Same "any verified broker" pool as Referrals/Collaboration — no opt-in required (decision 3).
    fetch("/api/network/referrals/brokers")
      .then((res) => res.json())
      .then((json) => {
        if (json?.data) {
          setBrokers(json.data);
          if (json.data[0]) setTargetBrokerId(json.data[0].id);
        }
      });
  }, [open, brokers.length]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/properties/${propertyId}/shares`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetBrokerId }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(json.error?.message ?? "Could not share listing");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm">
        Share with a Broker
      </Button>
    );
  }

  return (
    <Card className="p-5">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <Label htmlFor="targetBrokerId">Broker</Label>
          <Select
            id="targetBrokerId"
            required
            value={targetBrokerId}
            onChange={(e) => setTargetBrokerId(e.target.value)}
          >
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
        <Button type="submit" size="sm" disabled={submitting || !targetBrokerId}>
          {submitting ? "Sharing…" : "Share"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </form>
      <FormError>{error}</FormError>
    </Card>
  );
}
