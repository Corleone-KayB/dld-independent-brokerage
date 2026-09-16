import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/server/rbac/guard";
import { getPropertyById } from "@/modules/properties/service";
import { listSharesForProperty } from "@/modules/property-sharing/service";
import { anyRoleHasPermission, PERMISSIONS } from "@/server/rbac/permissions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SharePropertyForm } from "@/components/property/share-property-form";
import { NetworkActionButton } from "@/components/network/network-action-button";

export const metadata: Metadata = { title: "Manage Sharing" };

export default async function PropertySharingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user?.partnerId) notFound();

  const property = await getPropertyById(id);
  if (!property) notFound();

  const canManageAll = anyRoleHasPermission(user.roles, PERMISSIONS.PROPERTIES_MANAGE_ALL);
  if (!canManageAll && user.partnerId !== property.partnerId) notFound();

  const shares = await listSharesForProperty(id);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-charcoal">Manage Sharing</h1>
          <p className="mt-1 text-charcoal/60">{property.title}</p>
        </div>
        <SharePropertyForm propertyId={id} />
      </div>

      {shares.length === 0 ? (
        <Card className="p-10 text-center text-charcoal/50">
          Not shared with anyone yet — it&apos;s only visible on your own team.
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {shares.map((s) => (
            <Card key={s.id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium text-charcoal">{s.recipientBroker.name}</p>
                <Badge tone={s.status === "ACTIVE" ? "success" : "neutral"}>{s.status}</Badge>
              </div>
              {s.status === "ACTIVE" && (
                <NetworkActionButton
                  endpoint={`/api/properties/shares/${s.id}/revoke`}
                  label="Revoke"
                  variant="outline"
                />
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
