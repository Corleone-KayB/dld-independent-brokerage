import Image from "next/image";
import Link from "next/link";
import type { Project, ProjectImage } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ProjectWithImages = Project & { images: ProjectImage[] };

export function ProjectCard({ project }: { project: ProjectWithImages }) {
  const image = project.images[0]?.url;

  return (
    <Link href={`/developers/projects/${project.slug}`} className="focus-ring block rounded-2xl">
      <Card className="overflow-hidden transition-shadow hover:shadow-elevated-hover">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-charcoal/5">
          {image ? (
            <Image src={image} alt={project.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-charcoal/40">Demo image placeholder</div>
          )}
          <Badge tone="champagne" className="absolute left-3 top-3">
            Off-Plan Project
          </Badge>
        </div>
        <div className="p-5">
          <h3 className="font-display text-lg font-semibold text-charcoal">{project.name}</h3>
          <p className="mt-1 text-xs text-charcoal/50">{project.community ?? project.city}</p>
        </div>
      </Card>
    </Link>
  );
}
