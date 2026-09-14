"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Label, Select, FormError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PROPERTY_TYPE_LABELS } from "@/lib/constants";

export function NewUnitForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    unitNumber: "",
    propertyType: "APARTMENT",
    bedrooms: "",
    bathrooms: "",
    sizeSqft: "",
    price: "",
    paymentPlan: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/projects/${projectId}/units`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        unitNumber: form.unitNumber || undefined,
        propertyType: form.propertyType,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
        sizeSqft: form.sizeSqft ? Number(form.sizeSqft) : undefined,
        price: Number(form.price),
        paymentPlan: form.paymentPlan || undefined,
      }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(json.error?.message ?? "Could not add unit");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return <Button onClick={() => setOpen(true)} size="sm">Add unit</Button>;
  }

  return (
    <Card className="p-5">
      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="unitNumber">Unit number</Label>
          <Input id="unitNumber" value={form.unitNumber} onChange={(e) => update("unitNumber", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="propertyType">Type</Label>
          <Select id="propertyType" value={form.propertyType} onChange={(e) => update("propertyType", e.target.value)}>
            {Object.entries(PROPERTY_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="price">Price (AED)</Label>
          <Input id="price" type="number" min={0} required value={form.price} onChange={(e) => update("price", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="bedrooms">Bedrooms</Label>
          <Input id="bedrooms" type="number" min={0} value={form.bedrooms} onChange={(e) => update("bedrooms", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="bathrooms">Bathrooms</Label>
          <Input id="bathrooms" type="number" min={0} value={form.bathrooms} onChange={(e) => update("bathrooms", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="sizeSqft">Size (sqft)</Label>
          <Input id="sizeSqft" type="number" min={0} value={form.sizeSqft} onChange={(e) => update("sizeSqft", e.target.value)} />
        </div>
        <div className="sm:col-span-3">
          <Label htmlFor="paymentPlan">Payment plan</Label>
          <Input id="paymentPlan" placeholder="e.g. 60/40" value={form.paymentPlan} onChange={(e) => update("paymentPlan", e.target.value)} />
        </div>
        <div className="sm:col-span-3">
          <FormError>{error}</FormError>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={submitting}>{submitting ? "Saving…" : "Save unit"}</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
