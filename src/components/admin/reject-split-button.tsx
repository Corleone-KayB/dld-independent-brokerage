"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RejectSplitButton({ splitId }: { splitId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reject() {
    if (!reason.trim()) {
      setError("A reason is required");
      return;
    }
    setPending(true);
    setError(null);
    const res = await fetch(`/api/commissions/splits/${splitId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const json = await res.json().catch(() => null);
    setPending(false);
    if (!res.ok) {
      setError(json?.error?.message ?? "Could not reject split");
      return;
    }
    router.refresh();
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Reject
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Input placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} className="h-9 w-48" />
      <div className="flex gap-2">
        <Button size="sm" variant="destructive" disabled={pending} onClick={reject}>
          {pending ? "Rejecting…" : "Confirm reject"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Back
        </Button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
