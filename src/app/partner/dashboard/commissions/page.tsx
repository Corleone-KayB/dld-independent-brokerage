import type { Metadata } from "next";
import { getSessionUser } from "@/server/rbac/guard";
import { listCommissions, getCommissionSummary } from "@/modules/commissions/service";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatAed } from "@/lib/utils/format";
import { COMMISSION_STATUS_LABELS } from "@/lib/constants";

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

  const [commissions, summary] = await Promise.all([
    listCommissions({ partnerId: user.partnerId }),
    getCommissionSummary({ partnerId: user.partnerId }),
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
    </div>
  );
}
