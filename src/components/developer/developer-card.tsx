import Image from "next/image";
import Link from "next/link";
import type { Developer, Project } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { VerificationBadge } from "@/components/compliance/verification-badge";

export function DeveloperCard({ developer }: { developer: Developer & { projects: Project[] } }) {
  return (
    <Link href={`/developers/${developer.slug}`} className="focus-ring block rounded-2xl">
      <Card className="flex items-center gap-4 p-5 transition-shadow hover:shadow-elevated-hover">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-charcoal/10">
          {developer.logoUrl ? (
            <Image src={developer.logoUrl} alt={developer.name} fill sizes="64px" className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center font-display text-lg text-charcoal/50">
              {developer.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-semibold text-charcoal">{developer.name}</p>
          <p className="mt-1 text-xs text-charcoal/50">
            {developer.projects.length > 0 ? "Active projects available" : "No published projects yet"}
          </p>
          <VerificationBadge status={developer.verificationStatus} lastVerifiedAt={developer.lastVerifiedAt} className="mt-2" />
        </div>
      </Card>
    </Link>
  );
}
