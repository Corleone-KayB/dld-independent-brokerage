"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Select } from "@/components/ui/input";
import { DEAL_STAGE_LABELS } from "@/lib/constants";

export function DealStageSelect({ dealId, stage }: { dealId: string; stage: string }) {
  const router = useRouter();
  const [value, setValue] = useState(stage);
  const [saving, setSaving] = useState(false);

  async function handleChange(next: string) {
    setValue(next);
    setSaving(true);
    await fetch(`/api/deals/${dealId}/stage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: next }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <Select value={value} disabled={saving} onChange={(e) => handleChange(e.target.value)} className="h-9 w-40 text-xs">
      {Object.entries(DEAL_STAGE_LABELS).map(([key, label]) => (
        <option key={key} value={key}>{label}</option>
      ))}
    </Select>
  );
}
