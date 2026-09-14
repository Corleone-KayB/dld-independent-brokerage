import { propertyUpdateSchema } from "@/lib/validations/property";
import { getPropertyById, updateProperty, deleteProperty } from "@/modules/properties/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requirePermission, ownsPartnerResource, toErrorResponse, ForbiddenError } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";
import { writeAuditLog } from "@/server/audit/log";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await getPropertyById(id);
  if (!property) return apiError("NOT_FOUND", "Property not found", 404);
  return apiSuccess(property);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requirePermission(PERMISSIONS.PROPERTIES_MANAGE_OWN);
    const existing = await getPropertyById(id);
    if (!existing) return apiError("NOT_FOUND", "Property not found", 404);

    if (!ownsPartnerResource(user, existing.partnerId, PERMISSIONS.PROPERTIES_MANAGE_ALL)) {
      throw new ForbiddenError("You can only edit your own listings");
    }

    const json = await request.json().catch(() => null);
    const parsed = propertyUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 422);
    }

    const property = await updateProperty(id, parsed.data);

    await writeAuditLog({
      actorUserId: user.id,
      action: "PROPERTY_UPDATED",
      entityType: "Property",
      entityId: id,
      partnerId: user.partnerId,
    });

    return apiSuccess(property);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requirePermission(PERMISSIONS.PROPERTIES_MANAGE_OWN);
    const existing = await getPropertyById(id);
    if (!existing) return apiError("NOT_FOUND", "Property not found", 404);

    if (!ownsPartnerResource(user, existing.partnerId, PERMISSIONS.PROPERTIES_MANAGE_ALL)) {
      throw new ForbiddenError("You can only delete your own listings");
    }

    await deleteProperty(id);

    await writeAuditLog({
      actorUserId: user.id,
      action: "PROPERTY_DELETED",
      entityType: "Property",
      entityId: id,
      partnerId: user.partnerId,
    });

    return apiSuccess({ id });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
