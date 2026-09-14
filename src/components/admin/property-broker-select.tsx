"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/input";

export function PropertyBrokerSelect({
  propertyId,
  brokerId,
  brokers,
}: {
  propertyId: string;
  brokerId: string | null;
  brokers: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [value, setValue] = useState(brokerId ?? "");
  const [saving, setSaving] = useState(false);

  async function handleChange(nextBrokerId: string) {
    setValue(nextBrokerId);
    setSaving(true);
    await fetch(`/api/properties/${propertyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brokerId: nextBrokerId || null }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <Select value={value} disabled={saving} onChange={(e) => handleChange(e.target.value)} className="h-9 w-44 text-xs">
      <option value="">Unassigned</option>
      {brokers.map((broker) => (
        <option key={broker.id} value={broker.id}>{broker.name}</option>
      ))}
    </Select>
  );
}
