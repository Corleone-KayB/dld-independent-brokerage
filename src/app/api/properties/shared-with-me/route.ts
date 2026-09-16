import { listSharedWithMe } from "@/modules/property-sharing/service";
import { apiSuccess } from "@/lib/utils/api-response";
import { requirePermission, ForbiddenError, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";

export async function GET() {
  try {
    const user = await requirePermission(PERMISSIONS.PROPERTIES_MANAGE_OWN);
    if (!user.brokerId) throw new ForbiddenError("Only brokers can view shared listings");

    const shares = await listSharedWithMe(user.brokerId);
    return apiSuccess(shares);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
