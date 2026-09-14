import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { COMMUNITIES } from "@/lib/constants";

export const metadata: Metadata = { title: "Communities" };

export default function CommunitiesPage() {
  return (
    <div className="container-shell py-12">
      <h1 className="font-display text-3xl font-semibold text-charcoal">Dubai Communities</h1>
      <p className="mt-2 max-w-2xl text-charcoal/60">
        Explore Dubai&apos;s most sought-after neighborhoods, with featured
        brokers and available properties in each area.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {COMMUNITIES.map((community) => (
          <Link key={community} href={`/communities/${encodeURIComponent(community)}`}>
            <Card className="p-6 transition-shadow hover:shadow-glass">
              <p className="font-display text-lg font-semibold text-charcoal">{community}</p>
              <p className="mt-1 text-sm text-charcoal/50">View properties &amp; brokers</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
