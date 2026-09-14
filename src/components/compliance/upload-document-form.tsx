"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input, Label, Select, FormError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const DOCUMENT_TYPES = [
  { value: "TRADE_LICENSE", label: "Trade License" },
  { value: "BROKER_CARD", label: "Broker Card" },
  { value: "PROFESSIONAL_CREDENTIAL", label: "Professional Credential" },
  { value: "IDENTIFICATION", label: "Identification" },
  { value: "AGREEMENT", label: "Agreement" },
  { value: "OTHER", label: "Other" },
];

export function UploadDocumentForm({ partnerId }: { partnerId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("partnerId", partnerId);

    const res = await fetch("/api/compliance/documents", { method: "POST", body: formData });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(json.error?.message ?? "Could not upload document");
      return;
    }
    formRef.current?.reset();
    router.refresh();
  }

  return (
    <Card className="p-5">
      <form ref={formRef} onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="type">Document type</Label>
          <Select id="type" name="type" required defaultValue="TRADE_LICENSE">
            {DOCUMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="name">Document name</Label>
          <Input id="name" name="name" required placeholder="e.g. 2026 Trade License" />
        </div>
        <div>
          <Label htmlFor="expiresAt">Expiry date (optional)</Label>
          <Input id="expiresAt" name="expiresAt" type="date" />
        </div>
        <div>
          <Label htmlFor="file">File</Label>
          <input id="file" name="file" type="file" required className="focus-ring block w-full text-sm" />
        </div>
        <div className="sm:col-span-2">
          <FormError>{error}</FormError>
          <Button type="submit" size="sm" disabled={submitting}>{submitting ? "Uploading…" : "Upload document"}</Button>
        </div>
      </form>
    </Card>
  );
}
