import { matchRequestSchema } from "@/lib/validations/matching";
import { adviseOnProperties, compareAreas } from "@/server/advisor/property-advisor";
import { prisma } from "@/server/db/client";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

/** AI Property Advisor — public investor tool, deterministic engine. */
export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = matchRequestSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 422);
  }

  const properties = await prisma.property.findMany({ where: { status: "PUBLISHED" } });
  const advice = adviseOnProperties(properties, parsed.data);
  const areaComparison = compareAreas(properties);

  return apiSuccess({ advice, areaComparison });
}
