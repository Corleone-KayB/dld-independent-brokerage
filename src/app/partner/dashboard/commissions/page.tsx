import type { Metadata } from "next";
import { getSessionUser } from "@/server/rbac/guard";
import { listCommissions, getCommissionSummary } from "@/modules/commissions/service";
import { listMySplits } from "@/modules/commission-splits/service";
import { Card } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { formatAed } from "@/lib/utils/format";
import { COMMISSION_STATUS_LABELS } from "@/lib/constants";

const SPLIT_STATUS_TONE: Record<string, BadgeProps["tone"]> = {
  PENDING: "warning",
  APPROVED: "success",
  PAID: "success",
  REJECTED: "danger",
};

export const metadata: Metadata = { title: "Commissions" };

const STATUS_TONE: Record<string, "success" | "warning" | "neutral" | "danger"> = {
  PENDING: "neutral",
  EXPECTED: "warning",
  APPROVED: "success",
  PAID: "success",
  DISPUTED: "danger",
};

export default async function CommissionsPage() {
  const user = await getSessionUser();
  if (!user?.partnerId) return <p className="text-charcoal/60">No partner account linked.</p>;

  const [commissions, summary, mySplits] = await Promise.all([
    listCommissions({ partnerId: user.partnerId }),
    getCommissionSummary({ partnerId: user.partnerId }),
    user.brokerId ? listMySplits(user.brokerId) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal">Commissions</h1>
        <p className="mt-1 text-charcoal/60">Your commission pipeline across all deals.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Object.entries(COMMISSION_STATUS_LABELS).map(([key, label]) => (
          <Card key={key} className="p-4">
            <p className="text-xs uppercase tracking-wide text-charcoal/50">{label}</p>
            <p className="mt-2 font-display text-xl font-semibold text-charcoal">
              {formatAed(summary[key as keyof typeof summary]?.total ?? 0)}
            </p>
          </Card>
        ))}
      </div>

      {commissions.length === 0 ? (
        <Card className="p-10 text-center text-charcoal/50">No commissions yet.</Card>
      ) : (
        <div className="space-y-3">
          {commissions.map((commission) => (
            <Card key={commission.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium text-charcoal">{commission.deal.property?.title ?? "Deal"}</p>
                <p className="text-xs text-charcoal/50">{formatAed(commission.amount)}</p>
              </div>
              <Badge tone={STATUS_TONE[commission.status]}>{COMMISSION_STATUS_LABELS[commission.status]}</Badge>
            </Card>
          ))}
        </div>
      )}

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-charcoal">
          Split Payouts{mySplits.length > 0 && ` (${mySplits.length})`}
        </h2>
        <p className="mb-3 text-sm text-charcoal/60">
          Your share of commissions from deals you collaborated or referred on.
        </p>
        {mySplits.length === 0 ? (
          <p className="text-sm text-charcoal/50">No split payouts yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {mySplits.map((s) => (
              <Card key={s.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-charcoal">
                      {s.commission.deal.property?.title ?? s.commission.deal.client?.name ?? "Deal"}
                    </p>
                    <p className="text-xs text-charcoal/50">
                      {s.percent.toString()}% · {formatAed(s.amount)}
                    </p>
                  </div>
                  <Badge tone={SPLIT_STATUS_TONE[s.status]}>{s.status}</Badge>
                </div>
                {s.status === "REJECTED" && s.rejectionReason && (
                  <p className="mt-1 text-xs text-red-600">Reason: {s.rejectionReason}</p>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
