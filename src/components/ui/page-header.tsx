import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function PageHeader({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cn(align === "center" && "mx-auto max-w-2xl text-center", className)}>
      {eyebrow && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-champagne-dark">{eyebrow}</p>
      )}
      <h1 className="font-display text-3xl font-semibold tracking-tight text-charcoal sm:text-4xl">{title}</h1>
      {description && (
        <p className={cn("mt-3 text-charcoal/60", align !== "center" && "max-w-2xl")}>{description}</p>
      )}
    </div>
  );
}
