"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function StartConversationButton({ brokerId }: { brokerId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setPending(true);
    setError(null);
    const res = await fetch("/api/network/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brokerId }),
    });
    const json = await res.json().catch(() => null);
    setPending(false);
    if (!res.ok) {
      setError(json?.error?.message ?? "Could not open conversation");
      return;
    }
    router.push(`/partner/dashboard/messages/${json.data.id}`);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" variant="outline" disabled={pending} onClick={start}>
        {pending ? "Opening…" : "Message"}
      </Button>
      {error && <p className="max-w-[200px] text-right text-xs text-red-600">{error}</p>}
    </div>
  );
}
