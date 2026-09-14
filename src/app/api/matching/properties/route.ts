import { matchRequestSchema } from "@/lib/validations/matching";
import { rankProperties } from "@/server/matching/engine";
import { prisma } from "@/server/db/client";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = matchRequestSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 422);
  }

  const properties = await prisma.property.findMany({
    where: { status: "PUBLISHED" },
    include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
  });

  const ranked = rankProperties(properties, parsed.data).slice(0, 20);
  return apiSuccess(ranked);
}
