import { dealCreateSchema, dealStageEnum } from "@/lib/validations/deal";
import { listDeals, createDeal } from "@/modules/deals/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requireAnyPermission, requirePermission, toErrorResponse, ForbiddenError } from "@/server/rbac/guard";
import { anyRoleHasPermission, PERMISSIONS } from "@/server/rbac/permissions";
import { writeAuditLog } from "@/server/audit/log";

export async function GET(request: Request) {
  try {
    const user = await requireAnyPermission([PERMISSIONS.DEALS_MANAGE_OWN, PERMISSIONS.DEALS_MANAGE_ALL]);
    const { searchParams } = new URL(request.url);
    const stageParsed = dealStageEnum.safeParse(searchParams.get("stage"));
    const canManageAll = anyRoleHasPermission(user.roles, PERMISSIONS.DEALS_MANAGE_ALL);

    const deals = await listDeals({
      partnerId: canManageAll ? undefined : user.partnerId ?? undefined,
      brokerId: canManageAll ? undefined : user.brokerId ?? undefined,
      stage: stageParsed.success ? stageParsed.data : undefined,
    });
    return apiSuccess(deals);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requirePermission(PERMISSIONS.DEALS_MANAGE_OWN);
    if (!user.partnerId) throw new ForbiddenError("No partner scope on this account");

    const json = await request.json().catch(() => null);
    const parsed = dealCreateSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 422);
    }

    const deal = await createDeal(user.partnerId, {
      ...parsed.data,
      brokerId: parsed.data.brokerId ?? user.brokerId ?? undefined,
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "DEAL_CREATED",
      entityType: "Deal",
      entityId: deal.id,
      partnerId: user.partnerId,
    });

    return apiSuccess(deal, {}, 201);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
