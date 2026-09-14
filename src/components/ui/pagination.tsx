import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).slice(
    Math.max(0, page - 3),
    Math.max(0, page - 3) + 5,
  );

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2">
      <Link
        href={buildHref(Math.max(1, page - 1))}
        aria-disabled={page === 1}
        className={cn(
          "focus-ring rounded-full border border-charcoal/15 px-4 py-2 text-sm",
          page === 1 && "pointer-events-none opacity-40",
        )}
      >
        Previous
      </Link>
      {pages.map((p) => (
        <Link
          key={p}
          href={buildHref(p)}
          aria-current={p === page ? "page" : undefined}
          className={cn(
            "focus-ring flex h-9 w-9 items-center justify-center rounded-full border text-sm",
            p === page ? "border-champagne bg-champagne text-charcoal" : "border-charcoal/15 text-charcoal/70",
          )}
        >
          {p}
        </Link>
      ))}
      <Link
        href={buildHref(Math.min(totalPages, page + 1))}
        aria-disabled={page === totalPages}
        className={cn(
          "focus-ring rounded-full border border-charcoal/15 px-4 py-2 text-sm",
          page === totalPages && "pointer-events-none opacity-40",
        )}
      >
        Next
      </Link>
    </nav>
  );
}
