"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function AcceptLeadButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setPending(true);
    setError(null);
    const res = await fetch(`/api/leads/${leadId}/accept`, { method: "POST" });
    const json = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(json.error?.message ?? "Could not accept lead");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" disabled={pending} onClick={accept}>{pending ? "Accepting…" : "Accept Lead"}</Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
