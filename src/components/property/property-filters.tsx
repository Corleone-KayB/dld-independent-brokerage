"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Select, Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PROPERTY_PURPOSE_LABELS, PROPERTY_TYPE_LABELS } from "@/lib/constants";

export function PropertyFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [filters, setFilters] = useState({
    purpose: searchParams.get("purpose") ?? "",
    propertyType: searchParams.get("propertyType") ?? "",
    location: searchParams.get("location") ?? "",
    minPrice: searchParams.get("minPrice") ?? "",
    maxPrice: searchParams.get("maxPrice") ?? "",
    minBedrooms: searchParams.get("minBedrooms") ?? "",
  });

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function reset() {
    setFilters({ purpose: "", propertyType: "", location: "", minPrice: "", maxPrice: "", minBedrooms: "" });
    startTransition(() => {
      router.push(pathname);
    });
  }

  return (
    <form onSubmit={apply} className="grid gap-5 rounded-2xl border border-stone/20 bg-soft-white p-6 shadow-elevated sm:grid-cols-2 sm:p-8 lg:grid-cols-6">
      <div>
        <Label htmlFor="purpose">Purpose</Label>
        <Select id="purpose" value={filters.purpose} onChange={(e) => setFilters((f) => ({ ...f, purpose: e.target.value }))}>
          <option value="">Any</option>
          {Object.entries(PROPERTY_PURPOSE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="propertyType">Property type</Label>
        <Select id="propertyType" value={filters.propertyType} onChange={(e) => setFilters((f) => ({ ...f, propertyType: e.target.value }))}>
          <option value="">Any</option>
          {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="location">Location</Label>
        <Input id="location" placeholder="e.g. Dubai Marina" value={filters.location} onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))} />
      </div>

      <div>
        <Label htmlFor="minPrice">Min price (AED)</Label>
        <Input id="minPrice" type="number" min={0} value={filters.minPrice} onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value }))} />
      </div>

      <div>
        <Label htmlFor="maxPrice">Max price (AED)</Label>
        <Input id="maxPrice" type="number" min={0} value={filters.maxPrice} onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))} />
      </div>

      <div>
        <Label htmlFor="minBedrooms">Min bedrooms</Label>
        <Input id="minBedrooms" type="number" min={0} value={filters.minBedrooms} onChange={(e) => setFilters((f) => ({ ...f, minBedrooms: e.target.value }))} />
      </div>

      <div className="flex items-end justify-end gap-3 border-t border-stone/15 pt-5 lg:col-span-6">
        <Button type="button" variant="ghost" onClick={reset}>
          Reset
        </Button>
        <Button type="submit" disabled={isPending} className="px-8">
          {isPending ? "Searching…" : "Search"}
        </Button>
      </div>
    </form>
  );
}
