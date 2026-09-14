import { projectUpdateSchema } from "@/lib/validations/developer";
import { getProjectById, updateProject } from "@/modules/developers/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requireSessionUser, ForbiddenError, toErrorResponse } from "@/server/rbac/guard";
import { anyRoleHasPermission, PERMISSIONS } from "@/server/rbac/permissions";
import { writeAuditLog } from "@/server/audit/log";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) return apiError("NOT_FOUND", "Project not found", 404);
  return apiSuccess(project);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSessionUser();
    const { id } = await params;
    const existing = await getProjectById(id);
    if (!existing) return apiError("NOT_FOUND", "Project not found", 404);

    const isOwner =
      anyRoleHasPermission(user.roles, PERMISSIONS.DEVELOPER_MANAGE_OWN) &&
      existing.developer.partnerId === user.partnerId;
    const isAdmin = anyRoleHasPermission(user.roles, PERMISSIONS.PROPERTIES_MANAGE_ALL);
    if (!isOwner && !isAdmin) throw new ForbiddenError("You can only edit your own projects");

    const json = await request.json().catch(() => null);
    const parsed = projectUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 422);
    }

    const project = await updateProject(id, parsed.data);

    await writeAuditLog({
      actorUserId: user.id,
      action: "PROJECT_UPDATED",
      entityType: "Project",
      entityId: id,
      partnerId: user.partnerId,
    });

    return apiSuccess(project);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
