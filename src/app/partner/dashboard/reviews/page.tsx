import type { Metadata } from "next";
import { getSessionUser } from "@/server/rbac/guard";
import { listReviewableForBroker, listReviewsForBroker } from "@/modules/reputation/service";
import { Card } from "@/components/ui/card";
import { SubmitReviewForm } from "@/components/reputation/submit-review-form";

export const metadata: Metadata = { title: "Reviews" };

export default async function ReviewsPage() {
  const user = await getSessionUser();
  if (!user?.brokerId) {
    return <Card className="p-10 text-center text-charcoal/50">Peer reviews are available to broker accounts only.</Card>;
  }

  const [reviewable, received] = await Promise.all([
    listReviewableForBroker(user.brokerId),
    listReviewsForBroker(user.brokerId),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal">Reviews</h1>
        <p className="mt-1 text-charcoal/60">
          Peer reviews from brokers you&apos;ve completed a deal collaboration or referral with — the only kind of
          review on this platform.
        </p>
      </div>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-charcoal">
          People You Can Review{reviewable.length > 0 && ` (${reviewable.length})`}
        </h2>
        {reviewable.length === 0 ? (
          <p className="text-sm text-charcoal/50">
            Nothing to review yet — this appears once a deal you collaborated on is closed or a
            referral converts or closes.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {reviewable.map((item) => (
              <Card key={`${item.contextType}-${item.dealId ?? item.referralId}-${item.otherBrokerId}`} className="p-4">
                <p className="font-medium text-charcoal">{item.otherBrokerName}</p>
                <p className="mb-3 text-xs text-charcoal/50">
                  {item.contextType === "DEAL" ? "Deal" : "Referral"}: {item.label}
                </p>
                <SubmitReviewForm
                  revieweeBrokerId={item.otherBrokerId}
                  dealId={item.dealId}
                  referralId={item.referralId}
                />
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-charcoal">
          Reviews You&apos;ve Received{received.length > 0 && ` (${received.length})`}
        </h2>
        {received.length === 0 ? (
          <p className="text-sm text-charcoal/50">No reviews yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {received.map((r) => (
              <Card key={r.id} className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-charcoal">{r.reviewer.name}</p>
                  <p className="text-champagne-dark">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>
                </div>
                {r.comment && <p className="mt-2 text-sm text-charcoal/70">{r.comment}</p>}
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
