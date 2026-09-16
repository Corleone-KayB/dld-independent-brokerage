import { listMySplits } from "@/modules/commission-splits/service";
import { apiSuccess } from "@/lib/utils/api-response";
import { requirePermission, ForbiddenError, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";

export async function GET() {
  try {
    const user = await requirePermission(PERMISSIONS.COMMISSION_SPLITS_VIEW_OWN);
    if (!user.brokerId) throw new ForbiddenError("Only brokers have commission splits");

    const splits = await listMySplits(user.brokerId);
    return apiSuccess(splits);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
