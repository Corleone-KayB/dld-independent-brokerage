"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LeadMarketplaceToggle({ leadId, visibility }: { leadId: string; visibility: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibility: visibility === "MARKETPLACE" ? "PRIVATE" : "MARKETPLACE" }),
    });
    setPending(false);
    router.refresh();
  }

  return (
    <Button size="sm" variant={visibility === "MARKETPLACE" ? "outline" : "primary"} disabled={pending} onClick={toggle}>
      {visibility === "MARKETPLACE" ? "Withdraw from Marketplace" : "Release to Marketplace"}
    </Button>
  );
}
