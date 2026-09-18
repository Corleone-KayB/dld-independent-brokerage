import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { COMMUNITIES } from "@/lib/constants";

export const metadata: Metadata = { title: "Communities" };

export default function CommunitiesPage() {
  return (
    <div className="container-shell py-12">
      <PageHeader
        title="Dubai Communities"
        description="Explore Dubai's most sought-after neighborhoods, with featured brokers and available properties in each area."
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {COMMUNITIES.map((community) => (
          <Link key={community} href={`/communities/${encodeURIComponent(community)}`}>
            <Card className="p-6 transition-shadow hover:shadow-elevated-hover">
              <p className="font-display text-lg font-semibold text-charcoal">{community}</p>
              <p className="mt-1 text-sm text-charcoal/50">View properties &amp; brokers</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
