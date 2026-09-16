import { acceptReferral } from "@/modules/referrals/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requirePermission, ForbiddenError, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";
import { writeAuditLog } from "@/server/audit/log";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(PERMISSIONS.REFERRALS_MANAGE_OWN);
    if (!user.brokerId) throw new ForbiddenError("Only brokers can use referrals");
    const { id } = await params;

    const referral = await acceptReferral(id, user.brokerId, user.id);

    await writeAuditLog({
      actorUserId: user.id,
      action: "REFERRAL_ACCEPTED",
      entityType: "Referral",
      entityId: id,
      partnerId: user.partnerId,
      metadata: { resultingLeadId: referral.resultingLeadId },
    });

    return apiSuccess(referral);
  } catch (error) {
    if (error instanceof ForbiddenError) {
      const { status, body } = toErrorResponse(error);
      return Response.json(body, { status });
    }
    if (error instanceof Error) {
      return apiError("REFERRAL_ACCEPT_FAILED", error.message, 409);
    }
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
