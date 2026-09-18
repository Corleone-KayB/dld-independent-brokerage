import type { ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";

export function PageHero({
  image,
  children,
  className,
}: {
  image: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative overflow-hidden bg-obsidian text-ivory", className)}>
      <div className="absolute inset-0">
        <Image src={image} alt="" fill priority sizes="100vw" className="object-cover" />
        {/* Same legibility scrim recipe as the homepage hero: opaque at the text edge, clear on the right two-thirds. */}
        <div className="absolute inset-0 bg-gradient-to-r from-obsidian via-obsidian/60 to-transparent sm:to-obsidian/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian/80 via-transparent to-obsidian/10" />
      </div>
      <div className="container-shell relative py-20 sm:py-24">{children}</div>
    </section>
  );
}
