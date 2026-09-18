import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/server/rbac/guard";
import { getDeveloperByPartnerId, listProjectsForDeveloper } from "@/modules/developers/service";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewProjectForm } from "@/components/developer/new-project-form";

export const metadata: Metadata = { title: "Developer Projects" };

export default async function DeveloperDashboardPage() {
  const user = await getSessionUser();
  if (!user?.partnerId) notFound();

  const developer = await getDeveloperByPartnerId(user.partnerId);
  if (!developer) notFound();

  const projects = await listProjectsForDeveloper(developer.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-charcoal">My Projects</h1>
          <p className="mt-1 text-charcoal/60">Manage your off-plan projects and units.</p>
        </div>
        <NewProjectForm developerId={developer.id} />
      </div>

      {projects.length === 0 ? (
        <Card className="p-10 text-center text-charcoal/50">No projects yet.</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <Link key={project.id} href={`/partner/dashboard/developer/${project.id}`}>
              <Card className="p-5 transition-shadow hover:shadow-elevated-hover">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-display text-base font-semibold text-charcoal">{project.name}</p>
                  <Badge tone={project.status === "PUBLISHED" ? "success" : project.status === "PENDING_REVIEW" ? "warning" : "neutral"}>
                    {project.status.replace("_", " ")}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-charcoal/60">{project.community ?? project.city}</p>
                <p className="mt-2 text-xs text-charcoal/40">{project.units.length} units</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
