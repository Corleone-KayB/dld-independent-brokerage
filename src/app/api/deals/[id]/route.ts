import { getDeal } from "@/modules/deals/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requireAnyPermission, ownsPartnerResource, ForbiddenError, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAnyPermission([PERMISSIONS.DEALS_MANAGE_OWN, PERMISSIONS.DEALS_MANAGE_ALL]);
    const { id } = await params;
    const deal = await getDeal(id);
    if (!deal) return apiError("NOT_FOUND", "Deal not found", 404);

    const owned =
      ownsPartnerResource(user, deal.partnerId, PERMISSIONS.DEALS_MANAGE_ALL) ||
      (!!user.brokerId && user.brokerId === deal.brokerId);
    if (!owned) throw new ForbiddenError();

    return apiSuccess(deal);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
