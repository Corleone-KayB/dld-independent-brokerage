import type { Metadata } from "next";
import Link from "next/link";
import { searchBrokers } from "@/modules/brokers/service";
import { Card } from "@/components/ui/card";
import { VerificationBadge } from "@/components/compliance/verification-badge";

export const metadata: Metadata = { title: "Brokers" };

export default async function AdminBrokersPage() {
  const result = await searchBrokers({ pageSize: 50 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal">Brokers</h1>
        <p className="mt-1 text-charcoal/60">{result.total} brokers on the platform.</p>
      </div>

      {result.items.length === 0 ? (
        <Card className="p-10 text-center text-charcoal/50">No brokers yet.</Card>
      ) : (
        <div className="space-y-3">
          {result.items.map((broker) => (
            <Card key={broker.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <Link href={`/brokers/${broker.slug}`} className="focus-ring font-medium text-charcoal hover:text-champagne-dark">
                  {broker.name}
                </Link>
                <p className="text-xs text-charcoal/50">{broker.partner?.companyName ?? "Independent"}</p>
              </div>
              <VerificationBadge status={broker.verificationStatus} lastVerifiedAt={broker.lastVerifiedAt} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
