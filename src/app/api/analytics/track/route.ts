import { enquiryTrackSchema } from "@/lib/validations/analytics";
import { prisma } from "@/server/db/client";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

/**
 * Records WhatsApp-originated enquiries and property views (spec §27: "The
 * CRM should automatically record WhatsApp-originated enquiries where the
 * integration permits"). Public, fire-and-forget, best-effort — never
 * blocks the actual WhatsApp/property navigation.
 */
export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = enquiryTrackSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 422);
  }

  await prisma.enquiryLog.create({ data: parsed.data });
  return apiSuccess({ tracked: true });
}
