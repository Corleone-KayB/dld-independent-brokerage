import type { Metadata } from "next";
import { listPartners } from "@/modules/partners/service";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PartnerStatusActions } from "@/components/admin/partner-status-actions";
import { PARTNER_STATUS_LABELS, PARTNER_TYPE_LABELS } from "@/lib/constants";

export const metadata: Metadata = { title: "Partners" };

export default async function AdminPartnersPage() {
  const result = await listPartners({ pageSize: 50 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal">Partners</h1>
        <p className="mt-1 text-charcoal/60">{result.total} approved/managed partners.</p>
      </div>

      {result.items.length === 0 ? (
        <Card className="p-10 text-center text-charcoal/50">No partners yet.</Card>
      ) : (
        <div className="space-y-3">
          {result.items.map((partner) => (
            <Card key={partner.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium text-charcoal">{partner.companyName ?? partner.email ?? partner.id}</p>
                <p className="text-xs text-charcoal/50">{PARTNER_TYPE_LABELS[partner.type]}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={partner.status === "APPROVED" ? "success" : partner.status === "SUSPENDED" ? "danger" : "neutral"}>
                  {PARTNER_STATUS_LABELS[partner.status]}
                </Badge>
                <PartnerStatusActions partnerId={partner.id} currentStatus={partner.status} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
