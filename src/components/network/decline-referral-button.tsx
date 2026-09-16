"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DeclineReferralButton({ referralId }: { referralId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decline() {
    setPending(true);
    setError(null);
    const res = await fetch(`/api/network/referrals/${referralId}/decline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: reason || undefined }),
    });
    const json = await res.json().catch(() => null);
    setPending(false);
    if (!res.ok) {
      setError(json?.error?.message ?? "Could not decline referral");
      return;
    }
    router.refresh();
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Decline
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Input
        placeholder="Reason (optional)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="h-9 w-48"
      />
      <div className="flex gap-2">
        <Button size="sm" variant="destructive" disabled={pending} onClick={decline}>
          {pending ? "Declining…" : "Confirm decline"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Back
        </Button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
