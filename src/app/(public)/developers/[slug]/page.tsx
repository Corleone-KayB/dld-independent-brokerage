import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getDeveloperBySlug } from "@/modules/developers/service";
import { ProjectCard } from "@/components/developer/project-card";
import { VerificationBadge } from "@/components/compliance/verification-badge";
import { Card } from "@/components/ui/card";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const developer = await getDeveloperBySlug(slug);
  return { title: developer?.name ?? "Developer" };
}

export default async function DeveloperProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const developer = await getDeveloperBySlug(slug);
  if (!developer) notFound();

  return (
    <div className="container-shell py-12">
      <div className="grid gap-10 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-1">
          <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full bg-charcoal/10">
            {developer.logoUrl ? (
              <Image src={developer.logoUrl} alt={developer.name} fill className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center font-display text-2xl text-charcoal/50">
                {developer.name.charAt(0)}
              </div>
            )}
          </div>
          <h1 className="mt-4 text-center font-display text-2xl font-semibold text-charcoal">{developer.name}</h1>
          <div className="mt-4 flex justify-center">
            <VerificationBadge status={developer.verificationStatus} lastVerifiedAt={developer.lastVerifiedAt} />
          </div>
          {developer.description && (
            <p className="mt-4 whitespace-pre-line text-sm text-charcoal/70">{developer.description}</p>
          )}
        </Card>

        <div className="lg:col-span-2">
          <h2 className="mb-6 font-display text-xl font-semibold text-charcoal">Projects</h2>
          {developer.projects.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-charcoal/20 p-8 text-center text-charcoal/50">
              No published projects yet.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {developer.projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
