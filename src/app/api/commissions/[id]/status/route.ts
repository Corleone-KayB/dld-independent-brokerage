import { commissionStatusUpdateSchema } from "@/lib/validations/deal";
import { getCommission, updateCommissionStatus } from "@/modules/commissions/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requirePermission, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";
import { writeAuditLog } from "@/server/audit/log";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(PERMISSIONS.COMMISSIONS_MANAGE);
    const { id } = await params;
    const existing = await getCommission(id);
    if (!existing) return apiError("NOT_FOUND", "Commission not found", 404);

    const json = await request.json().catch(() => null);
    const parsed = commissionStatusUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 422);
    }

    const commission = await updateCommissionStatus(id, parsed.data);

    await writeAuditLog({
      actorUserId: user.id,
      action: "COMMISSION_STATUS_CHANGED",
      entityType: "Commission",
      entityId: id,
      partnerId: existing.partnerId,
      metadata: { status: parsed.data.status },
    });

    return apiSuccess(commission);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
