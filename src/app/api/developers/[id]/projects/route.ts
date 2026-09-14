import { projectCreateSchema } from "@/lib/validations/developer";
import { createProject, listProjectsForDeveloper } from "@/modules/developers/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requirePermission, ForbiddenError, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";
import { prisma } from "@/server/db/client";
import { writeAuditLog } from "@/server/audit/log";

async function assertOwnsDeveloper(userId: string, partnerId: string | null, developerId: string) {
  const developer = await prisma.developer.findUnique({ where: { id: developerId } });
  if (!developer) throw new Error("NOT_FOUND");
  if (developer.partnerId !== partnerId) throw new ForbiddenError("You can only manage your own developer projects");
  return developer;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(PERMISSIONS.DEVELOPER_MANAGE_OWN);
    const { id } = await params;
    await assertOwnsDeveloper(user.id, user.partnerId, id);
    const projects = await listProjectsForDeveloper(id);
    return apiSuccess(projects);
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return apiError("NOT_FOUND", "Developer not found", 404);
    }
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(PERMISSIONS.DEVELOPER_MANAGE_OWN);
    const { id } = await params;
    await assertOwnsDeveloper(user.id, user.partnerId, id);

    const json = await request.json().catch(() => null);
    const parsed = projectCreateSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 422);
    }

    const project = await createProject(id, parsed.data);

    await writeAuditLog({
      actorUserId: user.id,
      action: "PROJECT_CREATED",
      entityType: "Project",
      entityId: project.id,
      partnerId: user.partnerId,
    });

    return apiSuccess(project, {}, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return apiError("NOT_FOUND", "Developer not found", 404);
    }
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
