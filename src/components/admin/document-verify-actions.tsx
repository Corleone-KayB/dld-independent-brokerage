"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function DocumentVerifyActions({ documentId }: { documentId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function verify(status: "PLATFORM_VERIFIED" | "REJECTED") {
    setPending(true);
    await fetch(`/api/compliance/documents/${documentId}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verificationStatus: status }),
    });
    setPending(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" disabled={pending} onClick={() => verify("PLATFORM_VERIFIED")}>
        Mark Platform Verified
      </Button>
      <Button size="sm" variant="destructive" disabled={pending} onClick={() => verify("REJECTED")}>
        Reject
      </Button>
    </div>
  );
}
