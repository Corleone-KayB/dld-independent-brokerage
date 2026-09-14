"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { PropertyStatus } from "@prisma/client";

export function BlogPostStatusActions({ postId, currentStatus }: { postId: string; currentStatus: PropertyStatus }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function updateStatus(status: PropertyStatus) {
    setPending(true);
    await fetch(`/api/blog/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setPending(false);
    router.refresh();
  }

  async function remove() {
    if (!window.confirm("Delete this post permanently?")) return;
    setPending(true);
    await fetch(`/api/blog/${postId}`, { method: "DELETE" });
    setPending(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      {currentStatus !== "PUBLISHED" && (
        <Button size="sm" disabled={pending} onClick={() => updateStatus("PUBLISHED")}>Publish</Button>
      )}
      {currentStatus !== "ARCHIVED" && (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => updateStatus("ARCHIVED")}>Archive</Button>
      )}
      <Button size="sm" variant="destructive" disabled={pending} onClick={remove}>Delete</Button>
    </div>
  );
}
