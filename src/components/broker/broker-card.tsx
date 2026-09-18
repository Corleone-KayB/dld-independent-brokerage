import Image from "next/image";
import Link from "next/link";
import type { Broker } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { VerificationBadge } from "@/components/compliance/verification-badge";

export function BrokerCard({ broker }: { broker: Broker }) {
  return (
    <Link href={`/brokers/${broker.slug}`} className="focus-ring block rounded-2xl">
      <Card className="flex items-center gap-4 p-5 transition-shadow hover:shadow-elevated-hover">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-charcoal/10">
          {broker.photoUrl ? (
            <Image src={broker.photoUrl} alt={broker.name} fill sizes="64px" className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center font-display text-lg text-charcoal/50">
              {broker.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-semibold text-charcoal">{broker.name}</p>
          <p className="truncate text-xs text-charcoal/60">
            {broker.specializations.slice(0, 3).join(" · ") || "Independent Broker"}
          </p>
          <p className="mt-1 truncate text-xs text-charcoal/50">
            {broker.areasServed.slice(0, 3).join(", ") || "Dubai"}
          </p>
          <VerificationBadge status={broker.verificationStatus} lastVerifiedAt={broker.lastVerifiedAt} className="mt-2" />
        </div>
      </Card>
    </Link>
  );
}
