"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Label, Textarea, FormError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function NewBlogPostForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", excerpt: "", content: "", coverImageUrl: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/blog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(json.error?.message ?? "Could not create post");
      return;
    }
    setOpen(false);
    setForm({ title: "", excerpt: "", content: "", coverImageUrl: "" });
    router.refresh();
  }

  if (!open) {
    return <Button onClick={() => setOpen(true)} size="sm">New post</Button>;
  }

  return (
    <Card className="p-5">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" required value={form.title} onChange={(e) => update("title", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="excerpt">Excerpt</Label>
          <Input id="excerpt" value={form.excerpt} onChange={(e) => update("excerpt", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="coverImageUrl">Cover image URL</Label>
          <Input id="coverImageUrl" placeholder="https://images.unsplash.com/..." value={form.coverImageUrl} onChange={(e) => update("coverImageUrl", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="content">Content</Label>
          <Textarea id="content" required rows={8} value={form.content} onChange={(e) => update("content", e.target.value)} />
        </div>
        <FormError>{error}</FormError>
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={submitting}>{submitting ? "Saving…" : "Save draft"}</Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
        </div>
      </form>
    </Card>
  );
}
