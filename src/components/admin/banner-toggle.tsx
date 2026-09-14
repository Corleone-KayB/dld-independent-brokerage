"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function BannerToggle({ bannerId, isActive }: { bannerId: string; isActive: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    await fetch(`/api/banners/${bannerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    setPending(false);
    router.refresh();
  }

  async function remove() {
    if (!window.confirm("Delete this banner permanently?")) return;
    setPending(true);
    await fetch(`/api/banners/${bannerId}`, { method: "DELETE" });
    setPending(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" variant={isActive ? "outline" : "primary"} disabled={pending} onClick={toggle}>
        {isActive ? "Deactivate" : "Activate"}
      </Button>
      <Button size="sm" variant="destructive" disabled={pending} onClick={remove}>Delete</Button>
    </div>
  );
}
