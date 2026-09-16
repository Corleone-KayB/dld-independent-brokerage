import type { Metadata } from "next";
import { getSessionUser } from "@/server/rbac/guard";
import { listMyReferrals } from "@/modules/referrals/service";
import { Card } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { formatAed, formatDate } from "@/lib/utils/format";
import { SendReferralForm } from "@/components/network/send-referral-form";
import { NetworkActionButton } from "@/components/network/network-action-button";
import { DeclineReferralButton } from "@/components/network/decline-referral-button";

export const metadata: Metadata = { title: "Referrals" };

const STATUS_TONE: Record<string, BadgeProps["tone"]> = {
  SENT: "warning",
  ACCEPTED: "success",
  DECLINED: "danger",
  IN_PROGRESS: "champagne",
  CONVERTED: "success",
  CLOSED: "neutral",
  EXPIRED: "neutral",
  CANCELLED: "neutral",
};

export default async function ReferralsPage() {
  const user = await getSessionUser();
  if (!user?.brokerId) {
    return (
      <Card className="p-10 text-center text-charcoal/50">Referrals are available to broker accounts only.</Card>
    );
  }

  const { sent, received } = await listMyReferrals(user.brokerId);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-charcoal">Referrals</h1>
          <p className="mt-1 max-w-xl text-charcoal/60">
            Refer a client to another broker with a proposed commission split. Terms lock in once the receiving
            broker accepts — they cannot be silently changed afterward.
          </p>
        </div>
        <SendReferralForm />
      </div>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-charcoal">
          Received{received.length > 0 && ` (${received.length})`}
        </h2>
        {received.length === 0 ? (
          <p className="text-sm text-charcoal/50">No referrals received yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {received.map((r) => (
              <Card key={r.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-charcoal">{r.clientSnapshotName ?? "Referred client"}</p>
                    <p className="text-xs text-charcoal/50">from {r.referringBroker.name}</p>
                  </div>
                  <Badge tone={STATUS_TONE[r.status]}>{r.status.replace("_", " ")}</Badge>
                </div>
                {r.clientSnapshotBudget && (
                  <p className="mt-2 text-sm text-charcoal/70">Budget: {formatAed(r.clientSnapshotBudget)}</p>
                )}
                {r.requirementNotes && <p className="mt-1 text-sm text-charcoal/60">{r.requirementNotes}</p>}
                <p className="mt-2 text-xs text-charcoal/50">
                  Proposed split: {r.proposedSplitPercent?.toString() ?? "—"}%
                  {r.status !== "SENT" && r.acceptedSplitPercent !== null && (
                    <> · Locked: {r.acceptedSplitPercent.toString()}%</>
                  )}
                </p>
                <p className="mt-1 text-xs text-charcoal/40">Sent {formatDate(r.createdAt)}</p>

                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  {r.status === "SENT" && (
                    <>
                      <NetworkActionButton endpoint={`/api/network/referrals/${r.id}/accept`} label="Accept" />
                      <DeclineReferralButton referralId={r.id} />
                    </>
                  )}
                  {r.status === "ACCEPTED" && (
                    <>
                      <NetworkActionButton
                        endpoint={`/api/network/referrals/${r.id}/status`}
                        label="Mark In Progress"
                        variant="outline"
                        body={{ status: "IN_PROGRESS" }}
                      />
                      <NetworkActionButton
                        endpoint={`/api/network/referrals/${r.id}/status`}
                        label="Close"
                        variant="outline"
                        body={{ status: "CLOSED" }}
                      />
                    </>
                  )}
                  {r.status === "IN_PROGRESS" && (
                    <>
                      <NetworkActionButton
                        endpoint={`/api/network/referrals/${r.id}/status`}
                        label="Mark Converted"
                        body={{ status: "CONVERTED" }}
                      />
                      <NetworkActionButton
                        endpoint={`/api/network/referrals/${r.id}/status`}
                        label="Close"
                        variant="outline"
                        body={{ status: "CLOSED" }}
                      />
                    </>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-charcoal">
          Sent{sent.length > 0 && ` (${sent.length})`}
        </h2>
        {sent.length === 0 ? (
          <p className="text-sm text-charcoal/50">No referrals sent yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {sent.map((r) => (
              <Card key={r.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-charcoal">{r.clientSnapshotName ?? "Referred client"}</p>
                    <p className="text-xs text-charcoal/50">to {r.receivingBroker.name}</p>
                  </div>
                  <Badge tone={STATUS_TONE[r.status]}>{r.status.replace("_", " ")}</Badge>
                </div>
                <p className="mt-2 text-xs text-charcoal/50">
                  Proposed split: {r.proposedSplitPercent?.toString() ?? "—"}%
                  {r.status !== "SENT" && r.acceptedSplitPercent !== null && (
                    <> · Locked: {r.acceptedSplitPercent.toString()}%</>
                  )}
                </p>
                {r.status === "DECLINED" && r.declineReason && (
                  <p className="mt-1 text-xs text-red-600">Reason: {r.declineReason}</p>
                )}
                <p className="mt-1 text-xs text-charcoal/40">Sent {formatDate(r.createdAt)}</p>
                {r.status === "SENT" && (
                  <div className="mt-3 flex justify-end">
                    <NetworkActionButton
                      endpoint={`/api/network/referrals/${r.id}/cancel`}
                      label="Cancel"
                      variant="outline"
                    />
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
