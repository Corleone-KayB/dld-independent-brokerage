"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/input";

export function LeadAssignSelect({
  leadId,
  brokerId,
  brokers,
}: {
  leadId: string;
  brokerId: string | null;
  brokers: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [value, setValue] = useState(brokerId ?? "");
  const [saving, setSaving] = useState(false);

  async function handleChange(nextBrokerId: string) {
    if (!nextBrokerId) return;
    setValue(nextBrokerId);
    setSaving(true);
    await fetch(`/api/leads/${leadId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brokerId: nextBrokerId }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <Select value={value} disabled={saving} onChange={(e) => handleChange(e.target.value)} className="h-9 w-48 text-xs">
      <option value="">Unassigned</option>
      {brokers.map((broker) => (
        <option key={broker.id} value={broker.id}>{broker.name}</option>
      ))}
    </Select>
  );
}
