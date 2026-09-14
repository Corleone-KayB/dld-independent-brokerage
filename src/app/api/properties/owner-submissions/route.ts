import { ownerListingSchema } from "@/lib/validations/property";
import { submitOwnerListing } from "@/modules/properties/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

/** Public "List My Property" submission — Property Owner Portal (Phase 2). */
export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = ownerListingSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 422);
  }

  const property = await submitOwnerListing(parsed.data);
  return apiSuccess({ id: property.id, slug: property.slug, status: property.status }, {}, 201);
}
