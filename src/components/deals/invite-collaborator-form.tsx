"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Label, FormError, Select, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ReferrableBroker {
  id: string;
  name: string;
}

const ROLES = [
  { value: "CO_BROKER", label: "Co-Broker" },
  { value: "LISTING_BROKER", label: "Listing Broker" },
  { value: "BUYER_BROKER", label: "Buyer's Broker" },
  { value: "REFERRING_BROKER", label: "Referring Broker" },
];

export function InviteCollaboratorForm({ dealId }: { dealId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [brokers, setBrokers] = useState<ReferrableBroker[]>([]);
  const [brokerId, setBrokerId] = useState("");
  const [role, setRole] = useState("CO_BROKER");
  const [splitPercent, setSplitPercent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || brokers.length > 0) return;
    // Reuses the same "verified brokers excluding self" endpoint as Referrals — no network opt-in required.
    fetch("/api/network/referrals/brokers")
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
    const res = await fetch(`/api/deals/${dealId}/collaborators`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brokerId, role, splitPercent: splitPercent || undefined }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(json.error?.message ?? "Could not invite collaborator");
      return;
    }
    setSplitPercent("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm">
        Invite Collaborator
      </Button>
    );
  }

  return (
    <Card className="p-5">
      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="collabBrokerId">Broker</Label>
          <Select id="collabBrokerId" required value={brokerId} onChange={(e) => setBrokerId(e.target.value)}>
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
          <Label htmlFor="collabRole">Role</Label>
          <Select id="collabRole" value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="collabSplit">Proposed split (%)</Label>
          <Input
            id="collabSplit"
            type="number"
            min={0}
            max={100}
            value={splitPercent}
            onChange={(e) => setSplitPercent(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <FormError>{error}</FormError>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={submitting || !brokerId}>
              {submitting ? "Inviting…" : "Send invitation"}
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
