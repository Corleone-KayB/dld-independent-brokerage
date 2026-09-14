import { partnerApplicationSchema } from "@/lib/validations/partner";
import { submitPartnerApplication } from "@/modules/partners/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

/** Convenience alias of /api/partners/apply, always as an independent broker. */
export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = partnerApplicationSchema.safeParse({ ...json, type: "INDEPENDENT_BROKER" });
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 422);
  }

  const application = await submitPartnerApplication(parsed.data);
  return apiSuccess(application, {}, 201);
}
