import { listCommissions } from "@/modules/commissions/service";
import { apiSuccess } from "@/lib/utils/api-response";
import { requirePermission, toErrorResponse } from "@/server/rbac/guard";
import { anyRoleHasPermission, PERMISSIONS } from "@/server/rbac/permissions";

export async function GET() {
  try {
    const user = await requirePermission(PERMISSIONS.COMMISSIONS_VIEW);
    const canManageAll = anyRoleHasPermission(user.roles, PERMISSIONS.COMMISSIONS_MANAGE);

    const commissions = await listCommissions({
      partnerId: canManageAll ? undefined : user.partnerId ?? undefined,
      brokerId: canManageAll ? undefined : user.brokerId ?? undefined,
    });
    return apiSuccess(commissions);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
