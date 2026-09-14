import type { Metadata } from "next";
import { prisma } from "@/server/db/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PropertyStatusActions } from "@/components/admin/property-status-actions";
import { formatAed } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Properties" };

export default async function AdminPropertiesPage() {
  const properties = await prisma.property.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { broker: { select: { name: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal">Property Moderation</h1>
        <p className="mt-1 text-charcoal/60">{properties.length} listings across all statuses.</p>
      </div>

      {properties.length === 0 ? (
        <Card className="p-10 text-center text-charcoal/50">No properties yet.</Card>
      ) : (
        <div className="space-y-3">
          {properties.map((property) => (
            <Card key={property.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium text-charcoal">{property.title}</p>
                <p className="text-xs text-charcoal/50">
                  {property.broker?.name ?? "Unassigned"} · {formatAed(property.price)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={property.status === "PUBLISHED" ? "success" : property.status === "PENDING_REVIEW" ? "warning" : "neutral"}>
                  {property.status.replace("_", " ")}
                </Badge>
                <PropertyStatusActions propertyId={property.id} currentStatus={property.status} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
