// Accepts number, string, or a Prisma Decimal (or anything with a numeric
// toString/valueOf) without importing @prisma/client into this shared util.
type Numeric = number | string | { toString(): string } | null | undefined;

export function formatAed(value: Numeric): string {
  if (value === null || value === undefined) return "Price on request";
  const numeric = typeof value === "number" ? value : Number(value.toString());
  if (Number.isNaN(numeric)) return "Price on request";
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(numeric);
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(date);
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
