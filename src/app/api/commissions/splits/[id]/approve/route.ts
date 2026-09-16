import { approveSplit } from "@/modules/commission-splits/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requirePermission, ForbiddenError, UnauthorizedError, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";
import { writeAuditLog } from "@/server/audit/log";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(PERMISSIONS.COMMISSIONS_MANAGE);
    const { id } = await params;

    const split = await approveSplit(id, user.id, user.brokerId);

    await writeAuditLog({
      actorUserId: user.id,
      action: "COMMISSION_SPLIT_APPROVED",
      entityType: "CommissionSplit",
      entityId: id,
      partnerId: user.partnerId,
    });

    return apiSuccess(split);
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof UnauthorizedError) {
      const { status, body } = toErrorResponse(error);
      return Response.json(body, { status });
    }
    if (error instanceof Error) {
      return apiError("COMMISSION_SPLIT_APPROVE_FAILED", error.message, 409);
    }
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
