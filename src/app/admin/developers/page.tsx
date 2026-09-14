import type { Metadata } from "next";
import { prisma } from "@/server/db/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VerificationBadge } from "@/components/compliance/verification-badge";
import { ProjectStatusActions } from "@/components/admin/project-status-actions";

export const metadata: Metadata = { title: "Developers" };

export default async function AdminDevelopersPage() {
  const developers = await prisma.developer.findMany({
    orderBy: { createdAt: "desc" },
    include: { projects: { orderBy: { createdAt: "desc" } } },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal">Developers &amp; Projects</h1>
        <p className="mt-1 text-charcoal/60">{developers.length} developers on the platform.</p>
      </div>

      {developers.length === 0 ? (
        <Card className="p-10 text-center text-charcoal/50">No developers yet.</Card>
      ) : (
        developers.map((developer) => (
          <Card key={developer.id} className="p-6">
            <div className="flex items-center justify-between">
              <p className="font-display text-lg font-semibold text-charcoal">{developer.name}</p>
              <VerificationBadge status={developer.verificationStatus} lastVerifiedAt={developer.lastVerifiedAt} />
            </div>

            {developer.projects.length === 0 ? (
              <p className="mt-4 text-sm text-charcoal/50">No projects submitted yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {developer.projects.map((project) => (
                  <div key={project.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-charcoal/5 p-3">
                    <div>
                      <p className="font-medium text-charcoal">{project.name}</p>
                      <p className="text-xs text-charcoal/50">{project.community ?? project.city}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge tone={project.status === "PUBLISHED" ? "success" : project.status === "PENDING_REVIEW" ? "warning" : "neutral"}>
                        {project.status.replace("_", " ")}
                      </Badge>
                      <ProjectStatusActions projectId={project.id} currentStatus={project.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
