"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, type ButtonProps } from "@/components/ui/button";

export function NetworkActionButton({
  endpoint,
  label,
  pendingLabel,
  variant,
  size = "sm",
  body,
}: {
  endpoint: string;
  label: string;
  pendingLabel?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  body?: Record<string, unknown>;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function act() {
    setPending(true);
    setError(null);
    const res = await fetch(endpoint, {
      method: "POST",
      ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
    });
    const json = await res.json().catch(() => null);
    setPending(false);
    if (!res.ok) {
      setError(json?.error?.message ?? "Action failed");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size={size} variant={variant} disabled={pending} onClick={act}>
        {pending ? (pendingLabel ?? "Working…") : label}
      </Button>
      {error && <p className="max-w-[200px] text-right text-xs text-red-600">{error}</p>}
    </div>
  );
}
