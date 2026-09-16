import { listMyCollaborations } from "@/modules/deal-collaboration/service";
import { apiSuccess } from "@/lib/utils/api-response";
import { requirePermission, ForbiddenError, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";

export async function GET() {
  try {
    const user = await requirePermission(PERMISSIONS.DEALS_COLLABORATE);
    if (!user.brokerId) throw new ForbiddenError("Only brokers can collaborate on deals");

    const collaborations = await listMyCollaborations(user.brokerId);
    return apiSuccess(collaborations);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
