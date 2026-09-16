import type { Metadata } from "next";
import { getSessionUser } from "@/server/rbac/guard";
import { listMyCollaborations } from "@/modules/deal-collaboration/service";
import { Card } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { formatAed } from "@/lib/utils/format";
import { NetworkActionButton } from "@/components/network/network-action-button";

export const metadata: Metadata = { title: "Collaborations" };

const STATUS_TONE: Record<string, BadgeProps["tone"]> = {
  INVITED: "warning",
  ACCEPTED: "success",
  DECLINED: "danger",
  REMOVED: "neutral",
};

export default async function CollaborationsPage() {
  const user = await getSessionUser();
  if (!user?.brokerId) {
    return <Card className="p-10 text-center text-charcoal/50">Deal collaboration is available to broker accounts only.</Card>;
  }

  const collaborations = await listMyCollaborations(user.brokerId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal">Collaborations</h1>
        <p className="mt-1 text-charcoal/60">Deals other brokers have invited you to help on.</p>
      </div>

      {collaborations.length === 0 ? (
        <Card className="p-10 text-center text-charcoal/50">No collaboration invitations yet.</Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {collaborations.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-charcoal">{c.deal.client?.name ?? "Deal"}</p>
                  <p className="text-xs text-charcoal/50">
                    {c.deal.property?.title ?? "No property linked"} · with {c.deal.broker?.name ?? "—"}
                  </p>
                </div>
                <Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge>
              </div>
              <p className="mt-1 text-xs text-charcoal/50">Your role: {c.role.replace("_", " ")}</p>
              {c.deal.value && <p className="mt-1 text-xs text-charcoal/50">Deal value: {formatAed(c.deal.value)}</p>}
              {c.splitPercent && <p className="mt-1 text-xs text-charcoal/50">Proposed split: {c.splitPercent.toString()}%</p>}

              {c.status === "INVITED" && (
                <div className="mt-3 flex justify-end gap-2">
                  <NetworkActionButton endpoint={`/api/deals/collaborations/${c.id}/accept`} label="Accept" />
                  <NetworkActionButton
                    endpoint={`/api/deals/collaborations/${c.id}/decline`}
                    label="Decline"
                    variant="outline"
                  />
                </div>
              )}
              {c.status === "ACCEPTED" && (
                <div className="mt-3 flex justify-end">
                  <NetworkActionButton
                    endpoint={`/api/deals/collaborations/${c.id}/remove`}
                    label="Leave"
                    variant="outline"
                  />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
