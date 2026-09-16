import type { Metadata } from "next";
import { getSessionUser } from "@/server/rbac/guard";
import { listSharedWithMe } from "@/modules/property-sharing/service";
import { Card } from "@/components/ui/card";
import { formatAed } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Shared With Me" };

export default async function SharedWithMePage() {
  const user = await getSessionUser();
  if (!user?.brokerId) {
    return <Card className="p-10 text-center text-charcoal/50">Listing sharing is available to broker accounts only.</Card>;
  }

  const shares = await listSharedWithMe(user.brokerId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal">Shared With Me</h1>
        <p className="mt-1 text-charcoal/60">Listings other brokers have shared with you to present to your own clients.</p>
      </div>

      {shares.length === 0 ? (
        <Card className="p-10 text-center text-charcoal/50">No listings have been shared with you yet.</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shares.map((s) => (
            <Card key={s.id} className="p-5">
              <p className="font-display text-base font-semibold text-charcoal">{s.property.title}</p>
              <p className="mt-1 text-sm text-charcoal/60">{s.property.community ?? s.property.city}</p>
              <p className="mt-2 font-display text-lg font-semibold text-champagne-dark">
                {formatAed(s.property.price)}
              </p>
              <p className="mt-2 text-xs text-charcoal/50">Shared by {s.sharingBroker.name}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
