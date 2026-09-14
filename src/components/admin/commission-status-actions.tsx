"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { CommissionStatus } from "@prisma/client";

const NEXT_ACTIONS: Record<string, { status: CommissionStatus; label: string; variant: "primary" | "outline" | "destructive" }[]> = {
  PENDING: [
    { status: "EXPECTED", label: "Mark Expected", variant: "outline" },
    { status: "APPROVED", label: "Approve", variant: "primary" },
  ],
  EXPECTED: [{ status: "APPROVED", label: "Approve", variant: "primary" }],
  APPROVED: [{ status: "PAID", label: "Mark Paid", variant: "primary" }],
  PAID: [],
  DISPUTED: [{ status: "APPROVED", label: "Resolve & Approve", variant: "primary" }],
};

export function CommissionStatusActions({ commissionId, status }: { commissionId: string; status: CommissionStatus }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const actions = NEXT_ACTIONS[status] ?? [];

  async function updateStatus(next: CommissionStatus) {
    setPending(true);
    await fetch(`/api/commissions/${commissionId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setPending(false);
    router.refresh();
  }

  async function dispute() {
    const reason = window.prompt("Reason for dispute?");
    if (!reason) return;
    setPending(true);
    await fetch(`/api/commissions/${commissionId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "DISPUTED", disputedReason: reason }),
    });
    setPending(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      {actions.map((action) => (
        <Button key={action.status} size="sm" variant={action.variant} disabled={pending} onClick={() => updateStatus(action.status)}>
          {action.label}
        </Button>
      ))}
      {status !== "DISPUTED" && status !== "PAID" && (
        <Button size="sm" variant="destructive" disabled={pending} onClick={dispute}>Dispute</Button>
      )}
    </div>
  );
}
