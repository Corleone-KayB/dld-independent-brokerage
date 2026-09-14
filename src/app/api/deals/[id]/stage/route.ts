import { dealStageUpdateSchema } from "@/lib/validations/deal";
import { getDeal, updateDealStage } from "@/modules/deals/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requireAnyPermission, ownsPartnerResource, ForbiddenError, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";
import { writeAuditLog } from "@/server/audit/log";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAnyPermission([PERMISSIONS.DEALS_MANAGE_OWN, PERMISSIONS.DEALS_MANAGE_ALL]);
    const { id } = await params;
    const existing = await getDeal(id);
    if (!existing) return apiError("NOT_FOUND", "Deal not found", 404);

    const owned =
      ownsPartnerResource(user, existing.partnerId, PERMISSIONS.DEALS_MANAGE_ALL) ||
      (!!user.brokerId && user.brokerId === existing.brokerId);
    if (!owned) throw new ForbiddenError();

    const json = await request.json().catch(() => null);
    const parsed = dealStageUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 422);
    }

    const deal = await updateDealStage(id, parsed.data);

    await writeAuditLog({
      actorUserId: user.id,
      action: "DEAL_STAGE_CHANGED",
      entityType: "Deal",
      entityId: id,
      partnerId: user.partnerId,
      metadata: { stage: parsed.data.stage },
    });

    return apiSuccess(deal);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
