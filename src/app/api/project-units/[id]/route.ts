import { projectUnitUpdateSchema } from "@/lib/validations/developer";
import { getProjectUnitById, updateProjectUnit } from "@/modules/developers/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requirePermission, ForbiddenError, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(PERMISSIONS.DEVELOPER_MANAGE_OWN);
    const { id } = await params;
    const unit = await getProjectUnitById(id);
    if (!unit) return apiError("NOT_FOUND", "Unit not found", 404);
    if (unit.project.developer.partnerId !== user.partnerId) {
      throw new ForbiddenError("You can only manage units on your own projects");
    }

    const json = await request.json().catch(() => null);
    const parsed = projectUnitUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 422);
    }

    const updated = await updateProjectUnit(id, parsed.data);
    return apiSuccess(updated);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
