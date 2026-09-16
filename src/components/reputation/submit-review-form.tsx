"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea, FormError } from "@/components/ui/input";

export function SubmitReviewForm({
  revieweeBrokerId,
  dealId,
  referralId,
}: {
  revieweeBrokerId: string;
  dealId?: string;
  referralId?: string;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revieweeBrokerId, dealId, referralId, rating, comment: comment || undefined }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(json.error?.message ?? "Could not submit review");
      return;
    }
    setDone(true);
    router.refresh();
  }

  if (done) return <p className="text-xs text-emerald-700">Review submitted.</p>;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className={`focus-ring text-lg ${n <= rating ? "text-champagne-dark" : "text-charcoal/20"}`}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
          >
            ★
          </button>
        ))}
      </div>
      <Textarea
        placeholder="Optional comment about working with this broker…"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
      />
      <FormError>{error}</FormError>
      <Button size="sm" disabled={submitting} onClick={submit}>
        {submitting ? "Submitting…" : "Submit review"}
      </Button>
    </div>
  );
}
