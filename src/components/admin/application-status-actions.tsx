"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea, Label, FormError } from "@/components/ui/input";
import type { PartnerStatus } from "@prisma/client";

const ACTIONS: { status: PartnerStatus; label: string; variant: "primary" | "outline" | "destructive" }[] = [
  { status: "UNDER_REVIEW", label: "Move to Under Review", variant: "outline" },
  { status: "MORE_INFORMATION_REQUIRED", label: "Request More Information", variant: "outline" },
  { status: "APPROVED", label: "Approve", variant: "primary" },
  { status: "REJECTED", label: "Reject", variant: "destructive" },
];

export function ApplicationStatusActions({ applicationId, currentStatus }: { applicationId: string; currentStatus: PartnerStatus }) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<PartnerStatus | null>(null);

  async function updateStatus(status: PartnerStatus) {
    setPendingStatus(status);
    setError(null);
    const res = await fetch(`/api/partners/applications/${applicationId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reviewNotes: notes || undefined }),
    });
    const json = await res.json();
    setPendingStatus(null);
    if (!res.ok) {
      setError(json.error?.message ?? "Could not update status");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="notes">Review notes (optional)</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <FormError>{error}</FormError>
      <div className="flex flex-wrap gap-2">
        {ACTIONS.filter((a) => a.status !== currentStatus).map((action) => (
          <Button
            key={action.status}
            variant={action.variant}
            size="sm"
            disabled={pendingStatus !== null}
            onClick={() => updateStatus(action.status)}
          >
            {pendingStatus === action.status ? "Saving…" : action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
