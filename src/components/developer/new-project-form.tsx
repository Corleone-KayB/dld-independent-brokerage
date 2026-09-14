"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Label, Textarea, FormError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function NewProjectForm({ developerId }: { developerId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", community: "", imageUrl: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/developers/${developerId}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        community: form.community,
        images: form.imageUrl ? [form.imageUrl] : [],
      }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(json.error?.message ?? "Could not create project");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return <Button onClick={() => setOpen(true)} size="sm">Add project</Button>;
  }

  return (
    <Card className="p-5">
      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="name">Project name</Label>
          <Input id="name" required value={form.name} onChange={(e) => update("name", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="community">Community</Label>
          <Input id="community" value={form.community} onChange={(e) => update("community", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="imageUrl">Image URL (optional)</Label>
          <Input id="imageUrl" placeholder="https://images.unsplash.com/..." value={form.imageUrl} onChange={(e) => update("imageUrl", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" value={form.description} onChange={(e) => update("description", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <FormError>{error}</FormError>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={submitting}>{submitting ? "Saving…" : "Submit for review"}</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
