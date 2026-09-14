import { projectUnitCreateSchema } from "@/lib/validations/developer";
import { getProjectById, createProjectUnit } from "@/modules/developers/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requirePermission, ForbiddenError, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";
import { writeAuditLog } from "@/server/audit/log";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(PERMISSIONS.DEVELOPER_MANAGE_OWN);
    const { id } = await params;
    const project = await getProjectById(id);
    if (!project) return apiError("NOT_FOUND", "Project not found", 404);
    if (project.developer.partnerId !== user.partnerId) {
      throw new ForbiddenError("You can only manage units on your own projects");
    }

    const json = await request.json().catch(() => null);
    const parsed = projectUnitCreateSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 422);
    }

    const unit = await createProjectUnit(id, parsed.data);

    await writeAuditLog({
      actorUserId: user.id,
      action: "PROJECT_UNIT_CREATED",
      entityType: "ProjectUnit",
      entityId: unit.id,
      partnerId: user.partnerId,
    });

    return apiSuccess(unit, {}, 201);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
