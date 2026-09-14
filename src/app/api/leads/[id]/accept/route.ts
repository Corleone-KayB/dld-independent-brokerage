import { acceptMarketplaceLead } from "@/modules/leads/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requirePermission, ForbiddenError, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";
import { writeAuditLog } from "@/server/audit/log";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(PERMISSIONS.LEADS_MARKETPLACE_ACCEPT);
    if (!user.brokerId) throw new ForbiddenError("Only brokers can accept marketplace leads");
    const { id } = await params;

    const lead = await acceptMarketplaceLead(id, user.brokerId);

    await writeAuditLog({
      actorUserId: user.id,
      action: "LEAD_MARKETPLACE_ACCEPTED",
      entityType: "Lead",
      entityId: id,
      partnerId: lead.partnerId,
      metadata: { brokerId: user.brokerId },
    });

    return apiSuccess(lead);
  } catch (error) {
    if (error instanceof Error && error.message === "This lead is no longer available in the marketplace") {
      return apiError("LEAD_UNAVAILABLE", error.message, 409);
    }
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
