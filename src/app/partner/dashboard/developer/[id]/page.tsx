import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/server/rbac/guard";
import { getProjectById } from "@/modules/developers/service";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewUnitForm } from "@/components/developer/new-unit-form";
import { formatAed } from "@/lib/utils/format";
import { PROPERTY_TYPE_LABELS } from "@/lib/constants";

export const metadata: Metadata = { title: "Manage Project" };

export default async function ManageProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  const project = await getProjectById(id);

  if (!project || (user?.partnerId && project.developer.partnerId !== user.partnerId)) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-charcoal">{project.name}</h1>
          <Badge tone={project.status === "PUBLISHED" ? "success" : project.status === "PENDING_REVIEW" ? "warning" : "neutral"} className="mt-2">
            {project.status.replace("_", " ")}
          </Badge>
        </div>
        <NewUnitForm projectId={project.id} />
      </div>

      {project.status === "PENDING_REVIEW" && (
        <Card className="border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          This project is pending admin review before it appears publicly.
        </Card>
      )}

      <h2 className="font-display text-lg font-semibold text-charcoal">Units</h2>
      {project.units.length === 0 ? (
        <Card className="p-10 text-center text-charcoal/50">No units yet.</Card>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-stone/20 bg-soft-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-charcoal/10 text-xs uppercase tracking-wide text-charcoal/50">
              <tr>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {project.units.map((unit) => (
                <tr key={unit.id} className="border-b border-charcoal/5 last:border-0">
                  <td className="px-4 py-3">{unit.unitNumber ?? "—"}</td>
                  <td className="px-4 py-3">{PROPERTY_TYPE_LABELS[unit.propertyType] ?? unit.propertyType}</td>
                  <td className="px-4 py-3">{formatAed(unit.price)}</td>
                  <td className="px-4 py-3"><Badge tone="neutral">{unit.status.replace("_", " ")}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
