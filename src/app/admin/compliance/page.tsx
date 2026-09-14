import type { Metadata } from "next";
import { listAllComplianceDocuments, documentExpiryState } from "@/modules/compliance/service";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VerificationBadge } from "@/components/compliance/verification-badge";
import { DocumentVerifyActions } from "@/components/admin/document-verify-actions";
import { formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Compliance" };

const EXPIRY_TONE = { none: "neutral", valid: "success", expiring: "warning", expired: "danger" } as const;
const EXPIRY_LABEL = { none: "No expiry", valid: "Valid", expiring: "Expiring soon", expired: "Expired" } as const;

export default async function AdminCompliancePage() {
  const documents = await listAllComplianceDocuments();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal">Compliance Dashboard</h1>
        <p className="mt-1 text-charcoal/60">{documents.length} documents submitted by partners.</p>
      </div>

      {documents.length === 0 ? (
        <Card className="p-10 text-center text-charcoal/50">No documents submitted yet.</Card>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => {
            const expiry = documentExpiryState(doc.expiresAt);
            return (
              <Card key={doc.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium text-charcoal">{doc.name}</p>
                  <p className="text-xs text-charcoal/50">
                    {doc.partner.companyName ?? doc.partner.email} · {doc.type.replace("_", " ")} ·{" "}
                    {doc.expiresAt ? `Expires ${formatDate(doc.expiresAt)}` : "No expiry"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <VerificationBadge status={doc.verificationStatus} lastVerifiedAt={doc.verifiedAt} />
                  <Badge tone={EXPIRY_TONE[expiry]}>{EXPIRY_LABEL[expiry]}</Badge>
                  {doc.verificationStatus === "PENDING" && <DocumentVerifyActions documentId={doc.id} />}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
