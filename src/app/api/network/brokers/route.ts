import { listDiscoverableBrokers } from "@/modules/network/service";
import { apiSuccess } from "@/lib/utils/api-response";
import { requirePermission, ForbiddenError, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";

export async function GET() {
  try {
    const user = await requirePermission(PERMISSIONS.NETWORK_CONNECT);
    if (!user.brokerId) throw new ForbiddenError("Only brokers can browse the Independent Brokerage Network");

    const brokers = await listDiscoverableBrokers(user.brokerId);
    return apiSuccess(brokers);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
