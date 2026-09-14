"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select, Textarea, Label, FormError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ACTIVITY_TYPES = ["CALL", "EMAIL", "WHATSAPP", "MEETING", "NOTE"];

export function NewActivityForm({ clientId, leadId }: { clientId?: string; leadId?: string }) {
  const router = useRouter();
  const [type, setType] = useState(ACTIVITY_TYPES[0]);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, leadId, type, note }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(json.error?.message ?? "Could not log activity");
      return;
    }
    setNote("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label htmlFor="type">Type</Label>
        <Select id="type" value={type} onChange={(e) => setType(e.target.value)}>
          {ACTIVITY_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="note">Note</Label>
        <Textarea id="note" required value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <FormError>{error}</FormError>
      <Button type="submit" size="sm" disabled={submitting}>
        {submitting ? "Logging…" : "Log activity"}
      </Button>
    </form>
  );
}
