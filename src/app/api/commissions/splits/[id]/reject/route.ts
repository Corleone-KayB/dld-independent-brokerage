import { commissionSplitRejectSchema } from "@/lib/validations/commission-split";
import { rejectSplit } from "@/modules/commission-splits/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requirePermission, ForbiddenError, UnauthorizedError, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";
import { writeAuditLog } from "@/server/audit/log";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(PERMISSIONS.COMMISSIONS_MANAGE);
    const { id } = await params;

    const json = await request.json().catch(() => null);
    const parsed = commissionSplitRejectSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 422);
    }

    const split = await rejectSplit(id, user.id, user.brokerId, parsed.data.reason);

    await writeAuditLog({
      actorUserId: user.id,
      action: "COMMISSION_SPLIT_REJECTED",
      entityType: "CommissionSplit",
      entityId: id,
      partnerId: user.partnerId,
      metadata: { reason: parsed.data.reason },
    });

    return apiSuccess(split);
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof UnauthorizedError) {
      const { status, body } = toErrorResponse(error);
      return Response.json(body, { status });
    }
    if (error instanceof Error) {
      return apiError("COMMISSION_SPLIT_REJECT_FAILED", error.message, 409);
    }
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
