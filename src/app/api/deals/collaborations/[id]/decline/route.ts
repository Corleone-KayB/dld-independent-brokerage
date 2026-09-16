import { respondToCollaboration } from "@/modules/deal-collaboration/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requirePermission, ForbiddenError, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";
import { writeAuditLog } from "@/server/audit/log";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(PERMISSIONS.DEALS_COLLABORATE);
    if (!user.brokerId) throw new ForbiddenError("Only brokers can collaborate on deals");
    const { id } = await params;

    const collaborator = await respondToCollaboration(id, user.brokerId, false);

    await writeAuditLog({
      actorUserId: user.id,
      action: "DEAL_COLLABORATION_DECLINED",
      entityType: "DealCollaborator",
      entityId: id,
      partnerId: user.partnerId,
    });

    return apiSuccess(collaborator);
  } catch (error) {
    if (error instanceof ForbiddenError) {
      const { status, body } = toErrorResponse(error);
      return Response.json(body, { status });
    }
    if (error instanceof Error) {
      return apiError("COLLABORATION_DECLINE_FAILED", error.message, 409);
    }
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
