import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/modules/developers/service";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatAed } from "@/lib/utils/format";
import { PROPERTY_TYPE_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  return { title: project?.name ?? "Project" };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const whatsappMessage = `Hi, I'm interested in the "${project.name}" project by ${project.developer.name}.`;

  return (
    <div className="container-shell py-12">
      <nav className="mb-6 text-sm text-charcoal/50">
        <Link href="/developers" className="hover:text-charcoal">Developers</Link> /{" "}
        <Link href={`/developers/${project.developer.slug}`} className="hover:text-charcoal">{project.developer.name}</Link> / {project.name}
      </nav>

      <div className="grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-charcoal/5">
            {project.images[0] ? (
              <Image src={project.images[0].url} alt={project.name} fill className="object-cover" priority />
            ) : (
              <div className="flex h-full items-center justify-center text-charcoal/40">Demo image placeholder</div>
            )}
          </div>

          <h1 className="mt-6 font-display text-3xl font-semibold text-charcoal">{project.name}</h1>
          <p className="mt-1 text-charcoal/60">{project.community ?? project.city}</p>
          {project.description && <p className="mt-4 whitespace-pre-line text-charcoal/70">{project.description}</p>}

          {project.amenities.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {project.amenities.map((amenity) => (
                <Badge key={amenity} tone="neutral">{amenity}</Badge>
              ))}
            </div>
          )}

          <h2 className="mb-4 mt-10 font-display text-xl font-semibold text-charcoal">Available Units</h2>
          {project.units.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-charcoal/20 p-8 text-center text-charcoal/50">
              No units published yet.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-charcoal/10 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-charcoal/10 text-xs uppercase tracking-wide text-charcoal/50">
                  <tr>
                    <th className="px-4 py-3">Unit</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Bed/Bath</th>
                    <th className="px-4 py-3">Size</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Payment Plan</th>
                  </tr>
                </thead>
                <tbody>
                  {project.units.map((unit) => (
                    <tr key={unit.id} className="border-b border-charcoal/5 last:border-0">
                      <td className="px-4 py-3">{unit.unitNumber ?? "—"}</td>
                      <td className="px-4 py-3">{PROPERTY_TYPE_LABELS[unit.propertyType] ?? unit.propertyType}</td>
                      <td className="px-4 py-3">{unit.bedrooms ?? "—"} / {unit.bathrooms ?? "—"}</td>
                      <td className="px-4 py-3">{unit.sizeSqft ? `${unit.sizeSqft.toLocaleString()} sqft` : "—"}</td>
                      <td className="px-4 py-3 font-medium">{formatAed(unit.price)}</td>
                      <td className="px-4 py-3">{unit.paymentPlan ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <p className="text-xs uppercase tracking-wide text-charcoal/50">Developer</p>
            <Link href={`/developers/${project.developer.slug}`} className="focus-ring mt-2 block font-display text-lg font-semibold text-charcoal hover:text-champagne-dark">
              {project.developer.name}
            </Link>
            {project.completionDate && (
              <p className="mt-3 text-sm text-charcoal/60">
                Expected completion: {new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(project.completionDate)}
              </p>
            )}
            {project.brochureUrl && (
              <a href={project.brochureUrl} target="_blank" rel="noopener noreferrer" className="focus-ring mt-3 block text-sm text-champagne-dark underline">
                Download brochure
              </a>
            )}
            <div className="mt-4">
              <WhatsAppButton message={whatsappMessage} className="w-full">
                WhatsApp About This Project
              </WhatsAppButton>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
