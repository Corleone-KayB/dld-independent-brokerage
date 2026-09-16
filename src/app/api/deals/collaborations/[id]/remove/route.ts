import { getCollaboratorWithDeal, removeCollaborator } from "@/modules/deal-collaboration/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requireAnyPermission, isInvolvedBroker, ForbiddenError, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";
import { writeAuditLog } from "@/server/audit/log";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAnyPermission([PERMISSIONS.DEALS_COLLABORATE, PERMISSIONS.DEALS_MANAGE_ALL]);
    const { id } = await params;

    const collaborator = await getCollaboratorWithDeal(id);
    if (!collaborator) return apiError("NOT_FOUND", "Collaborator not found", 404);

    const authorized = isInvolvedBroker(
      user,
      [collaborator.deal.brokerId, collaborator.brokerId],
      PERMISSIONS.DEALS_MANAGE_ALL,
    );
    if (!authorized) throw new ForbiddenError();

    const updated = await removeCollaborator(id);

    await writeAuditLog({
      actorUserId: user.id,
      action: "DEAL_COLLABORATION_REMOVED",
      entityType: "DealCollaborator",
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
      return apiError("COLLABORATOR_REMOVE_FAILED", error.message, 409);
    }
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
