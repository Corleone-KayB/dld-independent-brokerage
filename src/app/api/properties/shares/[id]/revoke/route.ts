import { getShareWithProperty, revokeShare } from "@/modules/property-sharing/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requirePermission, ownsPartnerResource, ForbiddenError, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";
import { writeAuditLog } from "@/server/audit/log";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(PERMISSIONS.PROPERTIES_MANAGE_OWN);
    const { id } = await params;
    const share = await getShareWithProperty(id);
    if (!share) return apiError("NOT_FOUND", "Share not found", 404);

    if (!ownsPartnerResource(user, share.property.partnerId, PERMISSIONS.PROPERTIES_MANAGE_ALL)) {
      throw new ForbiddenError("You can only revoke sharing for your own listings");
    }

    const updated = await revokeShare(id);

    await writeAuditLog({
      actorUserId: user.id,
      action: "PROPERTY_SHARE_REVOKED",
      entityType: "PropertyShare",
      entityId: id,
      partnerId: user.partnerId,
    });

    return apiSuccess(updated);
  } catch (error) {
    if (error instanceof ForbiddenError) {
      const { status, body } = toErrorResponse(error);
      return Response.json(body, { status });
    }
    if (error instanceof Error) {
      return apiError("PROPERTY_SHARE_REVOKE_FAILED", error.message, 409);
    }
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
