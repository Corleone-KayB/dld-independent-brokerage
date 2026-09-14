"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Input, Label, Select, FormError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PROPERTY_TYPE_LABELS } from "@/lib/constants";

const INITIAL_STATE = {
  ownerName: "",
  ownerEmail: "",
  ownerPhone: "",
  purpose: "BUY",
  propertyType: "APARTMENT",
  price: "",
  rentalPrice: "",
  bedrooms: "",
  sizeSqft: "",
  community: "",
  imageUrl: "",
};

export function OwnerListingForm() {
  const [form, setForm] = useState(INITIAL_STATE);
  const [matchMode, setMatchMode] = useState<"match" | "later">("match");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function update<K extends keyof typeof INITIAL_STATE>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/properties/owner-submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerName: form.ownerName,
        ownerEmail: form.ownerEmail,
        ownerPhone: form.ownerPhone,
        purpose: form.purpose,
        propertyType: form.propertyType,
        price: form.purpose === "BUY" ? Number(form.price) : undefined,
        rentalPrice: form.purpose === "RENT" ? Number(form.rentalPrice) : undefined,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
        sizeSqft: form.sizeSqft ? Number(form.sizeSqft) : undefined,
        community: form.community,
        images: form.imageUrl ? [form.imageUrl] : [],
        matchRequested: matchMode === "match",
      }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(json.error?.message ?? "Something went wrong. Please try again.");
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <Card className="mx-auto max-w-lg p-10 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-champagne-dark" />
        <h2 className="mt-4 font-display text-2xl font-semibold text-charcoal">Listing Submitted</h2>
        <p className="mt-3 text-charcoal/60">
          Thank you. Our team will review your property{" "}
          {matchMode === "match" ? "and has suggested a verified broker to reach out to you" : "shortly"}. You&apos;ll hear from us by email.
        </p>
        <Button href="/" variant="outline" className="mt-6">Return to homepage</Button>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-2xl p-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="ownerName">Full name</Label>
            <Input id="ownerName" required value={form.ownerName} onChange={(e) => update("ownerName", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="ownerEmail">Email</Label>
            <Input id="ownerEmail" type="email" required value={form.ownerEmail} onChange={(e) => update("ownerEmail", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="ownerPhone">Mobile</Label>
            <Input id="ownerPhone" required value={form.ownerPhone} onChange={(e) => update("ownerPhone", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="purpose">I want to</Label>
            <Select id="purpose" value={form.purpose} onChange={(e) => update("purpose", e.target.value)}>
              <option value="BUY">Sell</option>
              <option value="RENT">Rent out</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="propertyType">Property type</Label>
            <Select id="propertyType" value={form.propertyType} onChange={(e) => update("propertyType", e.target.value)}>
              {Object.entries(PROPERTY_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="community">Community / Location</Label>
            <Input id="community" value={form.community} onChange={(e) => update("community", e.target.value)} />
          </div>
          {form.purpose === "BUY" ? (
            <div>
              <Label htmlFor="price">Asking price (AED)</Label>
              <Input id="price" type="number" min={0} required value={form.price} onChange={(e) => update("price", e.target.value)} />
            </div>
          ) : (
            <div>
              <Label htmlFor="rentalPrice">Annual rental price (AED)</Label>
              <Input id="rentalPrice" type="number" min={0} required value={form.rentalPrice} onChange={(e) => update("rentalPrice", e.target.value)} />
            </div>
          )}
          <div>
            <Label htmlFor="bedrooms">Bedrooms</Label>
            <Input id="bedrooms" type="number" min={0} value={form.bedrooms} onChange={(e) => update("bedrooms", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="sizeSqft">Size (sqft)</Label>
            <Input id="sizeSqft" type="number" min={0} value={form.sizeSqft} onChange={(e) => update("sizeSqft", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="imageUrl">Photo URL (optional)</Label>
            <Input id="imageUrl" placeholder="https://images.unsplash.com/..." value={form.imageUrl} onChange={(e) => update("imageUrl", e.target.value)} />
          </div>
        </div>

        <div className="rounded-xl border border-charcoal/10 p-4">
          <p className="text-sm font-medium text-charcoal">Broker preference</p>
          <div className="mt-2 flex flex-col gap-2 text-sm text-charcoal/70">
            <label className="flex items-center gap-2">
              <input type="radio" name="matchMode" checked={matchMode === "match"} onChange={() => setMatchMode("match")} />
              Let us match you with a verified broker
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="matchMode" checked={matchMode === "later"} onChange={() => setMatchMode("later")} />
              I&apos;ll choose a broker later from the directory
            </label>
          </div>
        </div>

        <FormError>{error}</FormError>
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Submitting…" : "Submit Listing"}
        </Button>
      </form>
    </Card>
  );
}
