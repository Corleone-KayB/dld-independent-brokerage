"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { PartnerStatus } from "@prisma/client";

export function PartnerStatusActions({ partnerId, currentStatus }: { partnerId: string; currentStatus: PartnerStatus }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function updateStatus(status: PartnerStatus) {
    setPending(true);
    await fetch(`/api/partners/${partnerId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setPending(false);
    router.refresh();
  }

  return currentStatus === "SUSPENDED" ? (
    <Button size="sm" variant="outline" disabled={pending} onClick={() => updateStatus("APPROVED")}>
      Reinstate
    </Button>
  ) : (
    <Button size="sm" variant="destructive" disabled={pending} onClick={() => updateStatus("SUSPENDED")}>
      Suspend
    </Button>
  );
}
