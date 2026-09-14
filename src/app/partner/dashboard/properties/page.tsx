import type { Metadata } from "next";
import { getSessionUser } from "@/server/rbac/guard";
import { prisma } from "@/server/db/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewPropertyForm } from "@/components/property/new-property-form";
import { formatAed } from "@/lib/utils/format";

export const metadata: Metadata = { title: "My Properties" };

export default async function DashboardPropertiesPage() {
  const user = await getSessionUser();
  if (!user?.partnerId) return <p className="text-charcoal/60">No partner account linked.</p>;

  const properties = await prisma.property.findMany({
    where: { partnerId: user.partnerId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-charcoal">My Properties</h1>
          <p className="mt-1 text-charcoal/60">Manage your listings.</p>
        </div>
        <NewPropertyForm />
      </div>

      {properties.length === 0 ? (
        <Card className="p-10 text-center text-charcoal/50">No listings yet.</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <Card key={property.id} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="font-display text-base font-semibold text-charcoal">{property.title}</p>
                <Badge tone={property.status === "PUBLISHED" ? "success" : property.status === "PENDING_REVIEW" ? "warning" : "neutral"}>
                  {property.status.replace("_", " ")}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-charcoal/60">{property.community ?? property.city}</p>
              <p className="mt-2 font-display text-lg font-semibold text-champagne-dark">{formatAed(property.price)}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
