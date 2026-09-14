import { bannerUpdateSchema } from "@/lib/validations/marketing";
import { updateBanner, deleteBanner } from "@/modules/marketing/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requirePermission, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";
import { writeAuditLog } from "@/server/audit/log";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(PERMISSIONS.MARKETING_MANAGE);
    const { id } = await params;

    const json = await request.json().catch(() => null);
    const parsed = bannerUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 422);
    }

    const banner = await updateBanner(id, parsed.data);

    await writeAuditLog({
      actorUserId: user.id,
      action: "BANNER_UPDATED",
      entityType: "Banner",
      entityId: id,
    });

    return apiSuccess(banner);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(PERMISSIONS.MARKETING_MANAGE);
    const { id } = await params;

    await deleteBanner(id);

    await writeAuditLog({
      actorUserId: user.id,
      action: "BANNER_DELETED",
      entityType: "Banner",
      entityId: id,
    });

    return apiSuccess({ id });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
