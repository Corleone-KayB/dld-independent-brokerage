"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Label, FormError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function NewBannerForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", subtitle: "", imageUrl: "", ctaLabel: "", ctaHref: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/banners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(json.error?.message ?? "Could not create banner");
      return;
    }
    setOpen(false);
    setForm({ title: "", subtitle: "", imageUrl: "", ctaLabel: "", ctaHref: "" });
    router.refresh();
  }

  if (!open) {
    return <Button onClick={() => setOpen(true)} size="sm">New banner</Button>;
  }

  return (
    <Card className="p-5">
      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" required value={form.title} onChange={(e) => update("title", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="subtitle">Subtitle</Label>
          <Input id="subtitle" value={form.subtitle} onChange={(e) => update("subtitle", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="ctaLabel">CTA label</Label>
          <Input id="ctaLabel" value={form.ctaLabel} onChange={(e) => update("ctaLabel", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="ctaHref">CTA link</Label>
          <Input id="ctaHref" placeholder="/properties" value={form.ctaHref} onChange={(e) => update("ctaHref", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="imageUrl">Background image URL (optional)</Label>
          <Input id="imageUrl" placeholder="https://images.unsplash.com/..." value={form.imageUrl} onChange={(e) => update("imageUrl", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <FormError>{error}</FormError>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={submitting}>{submitting ? "Saving…" : "Save banner"}</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
