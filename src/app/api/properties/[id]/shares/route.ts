import { propertyShareCreateSchema } from "@/lib/validations/property-sharing";
import { getPropertyById } from "@/modules/properties/service";
import { listSharesForProperty, shareProperty } from "@/modules/property-sharing/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requirePermission, ownsPartnerResource, ForbiddenError, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";
import { RateLimitError } from "@/server/security/rate-limit";
import { writeAuditLog } from "@/server/audit/log";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(PERMISSIONS.PROPERTIES_MANAGE_OWN);
    const { id } = await params;
    const property = await getPropertyById(id);
    if (!property) return apiError("NOT_FOUND", "Property not found", 404);

    if (!ownsPartnerResource(user, property.partnerId, PERMISSIONS.PROPERTIES_MANAGE_ALL)) {
      throw new ForbiddenError("You can only manage sharing for your own listings");
    }

    const shares = await listSharesForProperty(id);
    return apiSuccess(shares);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(PERMISSIONS.PROPERTIES_MANAGE_OWN);
    if (!user.brokerId) throw new ForbiddenError("Only brokers can share listings");
    const { id } = await params;
    const property = await getPropertyById(id);
    if (!property) return apiError("NOT_FOUND", "Property not found", 404);

    if (!ownsPartnerResource(user, property.partnerId, PERMISSIONS.PROPERTIES_MANAGE_ALL)) {
      throw new ForbiddenError("You can only share your own listings");
    }

    const json = await request.json().catch(() => null);
    const parsed = propertyShareCreateSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 422);
    }

    const share = await shareProperty(id, user.brokerId, parsed.data.targetBrokerId);

    await writeAuditLog({
      actorUserId: user.id,
      action: "PROPERTY_SHARED",
      entityType: "PropertyShare",
      entityId: share.id,
      partnerId: user.partnerId,
      metadata: { propertyId: id, targetBrokerId: parsed.data.targetBrokerId },
    });

    return apiSuccess(share, {}, 201);
  } catch (error) {
    if (error instanceof RateLimitError || error instanceof ForbiddenError) {
      const { status, body } = toErrorResponse(error);
      return Response.json(body, { status });
    }
    if (error instanceof Error) {
      return apiError("PROPERTY_SHARE_FAILED", error.message, 409);
    }
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
