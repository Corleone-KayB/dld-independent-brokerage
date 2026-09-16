"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Label, FormError, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ReferrableBroker {
  id: string;
  name: string;
  areasServed: string[];
}

export function SendReferralForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [brokers, setBrokers] = useState<ReferrableBroker[]>([]);
  const [receivingBrokerId, setReceivingBrokerId] = useState("");
  const [clientSnapshotName, setClientSnapshotName] = useState("");
  const [clientSnapshotPhone, setClientSnapshotPhone] = useState("");
  const [clientSnapshotEmail, setClientSnapshotEmail] = useState("");
  const [clientSnapshotBudget, setClientSnapshotBudget] = useState("");
  const [requirementNotes, setRequirementNotes] = useState("");
  const [proposedSplitPercent, setProposedSplitPercent] = useState("20");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || brokers.length > 0) return;
    fetch("/api/network/referrals/brokers")
      .then((res) => res.json())
      .then((json) => {
        if (json?.data) {
          setBrokers(json.data);
          if (json.data[0]) setReceivingBrokerId(json.data[0].id);
        }
      });
  }, [open, brokers.length]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/network/referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receivingBrokerId,
        clientSnapshotName,
        clientSnapshotPhone: clientSnapshotPhone || undefined,
        clientSnapshotEmail: clientSnapshotEmail || undefined,
        clientSnapshotBudget: clientSnapshotBudget || undefined,
        requirementNotes: requirementNotes || undefined,
        proposedSplitPercent: proposedSplitPercent || undefined,
      }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(json.error?.message ?? "Could not send referral");
      return;
    }
    setClientSnapshotName("");
    setClientSnapshotPhone("");
    setClientSnapshotEmail("");
    setClientSnapshotBudget("");
    setRequirementNotes("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm">
        Refer a Client
      </Button>
    );
  }

  return (
    <Card className="p-5">
      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="receivingBrokerId">Refer to broker</Label>
          <Select
            id="receivingBrokerId"
            required
            value={receivingBrokerId}
            onChange={(e) => setReceivingBrokerId(e.target.value)}
          >
            <option value="" disabled>
              {brokers.length === 0 ? "Loading brokers…" : "Select a broker"}
            </option>
            {brokers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} {b.areasServed.length > 0 ? `— ${b.areasServed.slice(0, 2).join(", ")}` : ""}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="clientSnapshotName">Client name</Label>
          <Input
            id="clientSnapshotName"
            required
            value={clientSnapshotName}
            onChange={(e) => setClientSnapshotName(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="clientSnapshotPhone">Client phone</Label>
          <Input
            id="clientSnapshotPhone"
            value={clientSnapshotPhone}
            onChange={(e) => setClientSnapshotPhone(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="clientSnapshotEmail">Client email</Label>
          <Input
            id="clientSnapshotEmail"
            type="email"
            value={clientSnapshotEmail}
            onChange={(e) => setClientSnapshotEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="clientSnapshotBudget">Budget (AED)</Label>
          <Input
            id="clientSnapshotBudget"
            type="number"
            min={0}
            value={clientSnapshotBudget}
            onChange={(e) => setClientSnapshotBudget(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="requirementNotes">What the client is looking for</Label>
          <Textarea
            id="requirementNotes"
            value={requirementNotes}
            onChange={(e) => setRequirementNotes(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="proposedSplitPercent">Proposed commission split (%)</Label>
          <Input
            id="proposedSplitPercent"
            type="number"
            min={0}
            max={100}
            value={proposedSplitPercent}
            onChange={(e) => setProposedSplitPercent(e.target.value)}
          />
          <p className="mt-1 text-xs text-charcoal/50">Locked in once the receiving broker accepts.</p>
        </div>
        <div className="sm:col-span-2">
          <FormError>{error}</FormError>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={submitting || !receivingBrokerId}>
              {submitting ? "Sending…" : "Send referral"}
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
