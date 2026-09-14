import { listMarketplaceLeads } from "@/modules/leads/service";
import { apiSuccess } from "@/lib/utils/api-response";
import { requirePermission, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";

export async function GET() {
  try {
    await requirePermission(PERMISSIONS.LEADS_MARKETPLACE_VIEW);
    const leads = await listMarketplaceLeads();
    return apiSuccess(leads);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
