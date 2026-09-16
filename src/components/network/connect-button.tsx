"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ConnectButton({ targetBrokerId, label = "Connect" }: { targetBrokerId: string; label?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function connect() {
    setPending(true);
    setError(null);
    const res = await fetch("/api/network/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetBrokerId }),
    });
    const json = await res.json().catch(() => null);
    setPending(false);
    if (!res.ok) {
      setError(json?.error?.message ?? "Could not send request");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" variant="outline" disabled={pending} onClick={connect}>
        {pending ? "Sending…" : label}
      </Button>
      {error && <p className="max-w-[220px] text-right text-xs text-red-600">{error}</p>}
    </div>
  );
}
