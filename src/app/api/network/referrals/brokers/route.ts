import { listReferrableBrokers } from "@/modules/referrals/service";
import { apiSuccess } from "@/lib/utils/api-response";
import { requirePermission, ForbiddenError, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";

export async function GET() {
  try {
    const user = await requirePermission(PERMISSIONS.REFERRALS_MANAGE_OWN);
    if (!user.brokerId) throw new ForbiddenError("Only brokers can use referrals");

    const brokers = await listReferrableBrokers(user.brokerId);
    return apiSuccess(brokers);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
