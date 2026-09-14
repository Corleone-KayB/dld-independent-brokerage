import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getApplication } from "@/modules/partners/service";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApplicationStatusActions } from "@/components/admin/application-status-actions";
import { PARTNER_STATUS_LABELS, PARTNER_TYPE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Application Detail" };

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const application = await getApplication(id);
  if (!application) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-charcoal">{application.fullName}</h1>
          <p className="mt-1 text-charcoal/60">{application.email} · {application.mobile}</p>
        </div>
        <Badge tone="neutral">{PARTNER_STATUS_LABELS[application.status]}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold text-charcoal">Application Details</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
            <div><dt className="text-charcoal/50">Type</dt><dd>{PARTNER_TYPE_LABELS[application.type]}</dd></div>
            <div><dt className="text-charcoal/50">Company</dt><dd>{application.company ?? "—"}</dd></div>
            <div><dt className="text-charcoal/50">Role</dt><dd>{application.role ?? "—"}</dd></div>
            <div><dt className="text-charcoal/50">Broker Number</dt><dd>{application.brokerNumber ?? "—"}</dd></div>
            <div><dt className="text-charcoal/50">ORN</dt><dd>{application.orn ?? "—"}</dd></div>
            <div><dt className="text-charcoal/50">Brokerage</dt><dd>{application.brokerage ?? "—"}</dd></div>
            <div><dt className="text-charcoal/50">Specialization</dt><dd>{application.specialization ?? "—"}</dd></div>
            <div><dt className="text-charcoal/50">Experience</dt><dd>{application.experienceYears ?? "—"} years</dd></div>
            <div className="sm:col-span-2"><dt className="text-charcoal/50">Areas</dt><dd>{application.areas.join(", ") || "—"}</dd></div>
            <div className="sm:col-span-2"><dt className="text-charcoal/50">Business Focus</dt><dd>{application.businessFocus.join(", ") || "—"}</dd></div>
            <div className="sm:col-span-2"><dt className="text-charcoal/50">License Info</dt><dd>{application.licenseInfo ?? "—"}</dd></div>
            <div className="sm:col-span-2"><dt className="text-charcoal/50">Practice Card Info</dt><dd>{application.practiceCardInfo ?? "—"}</dd></div>
            <div><dt className="text-charcoal/50">Submitted</dt><dd>{formatDate(application.createdAt)}</dd></div>
          </dl>
          {application.reviewNotes && (
            <div className="mt-4 rounded-lg bg-charcoal/5 p-4 text-sm">
              <p className="text-xs uppercase tracking-wide text-charcoal/50">Latest review notes</p>
              <p className="mt-1 text-charcoal/80">{application.reviewNotes}</p>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold text-charcoal">Review Decision</h2>
          <p className="mt-2 text-xs text-charcoal/50">
            Approving provisions a login account. All status changes are
            recorded in the audit log.
          </p>
          <div className="mt-4">
            <ApplicationStatusActions applicationId={application.id} currentStatus={application.status} />
          </div>
        </Card>
      </div>
    </div>
  );
}
