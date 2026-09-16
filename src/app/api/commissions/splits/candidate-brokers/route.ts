import { listSplitCandidateBrokers } from "@/modules/commission-splits/service";
import { apiSuccess } from "@/lib/utils/api-response";
import { requirePermission, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";

export async function GET() {
  try {
    await requirePermission(PERMISSIONS.COMMISSIONS_MANAGE);
    const brokers = await listSplitCandidateBrokers();
    return apiSuccess(brokers);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
