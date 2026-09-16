import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/server/rbac/guard";
import { getDeal } from "@/modules/deals/service";
import { listCollaborators } from "@/modules/deal-collaboration/service";
import { anyRoleHasPermission, PERMISSIONS } from "@/server/rbac/permissions";
import { Card } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { formatAed } from "@/lib/utils/format";
import { InviteCollaboratorForm } from "@/components/deals/invite-collaborator-form";
import { NetworkActionButton } from "@/components/network/network-action-button";

export const metadata: Metadata = { title: "Deal" };

const STATUS_TONE: Record<string, BadgeProps["tone"]> = {
  INVITED: "warning",
  ACCEPTED: "success",
  DECLINED: "danger",
  REMOVED: "neutral",
};

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) notFound();

  const deal = await getDeal(id);
  if (!deal) notFound();

  const canManageAll = anyRoleHasPermission(user.roles, PERMISSIONS.DEALS_MANAGE_ALL);
  const isOwner = !!user.brokerId && user.brokerId === deal.brokerId;
  const isSamePartner = !!user.partnerId && user.partnerId === deal.partnerId;

  const collaborators = await listCollaborators(id);
  const isCollaborator = !!user.brokerId && collaborators.some((c) => c.brokerId === user.brokerId);

  if (!canManageAll && !isOwner && !isSamePartner && !isCollaborator) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal">
          {deal.client?.name ?? "Deal"}
          {deal.property ? ` — ${deal.property.title}` : ""}
        </h1>
        <p className="mt-1 text-charcoal/60">
          Stage: <Badge tone="neutral">{deal.stage}</Badge>
          {deal.value && <> · Value: {formatAed(deal.value)}</>}
        </p>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-charcoal">Collaborators</h2>
          {(isOwner || canManageAll) && <InviteCollaboratorForm dealId={id} />}
        </div>
        {collaborators.length === 0 ? (
          <p className="text-sm text-charcoal/50">
            No collaborators on this deal yet — it behaves exactly as before Phase 3.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {collaborators.map((c) => (
              <Card key={c.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-charcoal">{c.broker.name}</p>
                    <p className="text-xs text-charcoal/50">{c.role.replace("_", " ")}</p>
                  </div>
                  <Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge>
                </div>
                {c.splitPercent && (
                  <p className="mt-1 text-xs text-charcoal/50">Proposed split: {c.splitPercent.toString()}%</p>
                )}
                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  {c.status === "INVITED" && user.brokerId === c.brokerId && (
                    <>
                      <NetworkActionButton endpoint={`/api/deals/collaborations/${c.id}/accept`} label="Accept" />
                      <NetworkActionButton
                        endpoint={`/api/deals/collaborations/${c.id}/decline`}
                        label="Decline"
                        variant="outline"
                      />
                    </>
                  )}
                  {c.status !== "REMOVED" && (isOwner || canManageAll || user.brokerId === c.brokerId) && (
                    <NetworkActionButton
                      endpoint={`/api/deals/collaborations/${c.id}/remove`}
                      label="Remove"
                      variant="outline"
                    />
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
