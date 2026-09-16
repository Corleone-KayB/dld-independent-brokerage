import { referralDeclineSchema } from "@/lib/validations/network";
import { declineReferral } from "@/modules/referrals/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requirePermission, ForbiddenError, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";
import { writeAuditLog } from "@/server/audit/log";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(PERMISSIONS.REFERRALS_MANAGE_OWN);
    if (!user.brokerId) throw new ForbiddenError("Only brokers can use referrals");
    const { id } = await params;

    const json = await request.json().catch(() => ({}));
    const parsed = referralDeclineSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 422);
    }

    const referral = await declineReferral(id, user.brokerId, parsed.data.reason);

    await writeAuditLog({
      actorUserId: user.id,
      action: "REFERRAL_DECLINED",
      entityType: "Referral",
      entityId: id,
      partnerId: user.partnerId,
    });

    return apiSuccess(referral);
  } catch (error) {
    if (error instanceof ForbiddenError) {
      const { status, body } = toErrorResponse(error);
      return Response.json(body, { status });
    }
    if (error instanceof Error) {
      return apiError("REFERRAL_DECLINE_FAILED", error.message, 409);
    }
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
