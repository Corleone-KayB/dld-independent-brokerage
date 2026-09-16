import { referralStatusUpdateSchema } from "@/lib/validations/network";
import { advanceReferralStatus } from "@/modules/referrals/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requirePermission, ForbiddenError, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";
import { writeAuditLog } from "@/server/audit/log";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(PERMISSIONS.REFERRALS_MANAGE_OWN);
    if (!user.brokerId) throw new ForbiddenError("Only brokers can use referrals");
    const { id } = await params;

    const json = await request.json().catch(() => null);
    const parsed = referralStatusUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 422);
    }

    const referral = await advanceReferralStatus(
      id,
      user.brokerId,
      parsed.data.status,
      parsed.data.resultingDealId,
    );

    await writeAuditLog({
      actorUserId: user.id,
      action: "REFERRAL_STATUS_UPDATED",
      entityType: "Referral",
      entityId: id,
      partnerId: user.partnerId,
      metadata: { status: parsed.data.status },
    });

    return apiSuccess(referral);
  } catch (error) {
    if (error instanceof ForbiddenError) {
      const { status, body } = toErrorResponse(error);
      return Response.json(body, { status });
    }
    if (error instanceof Error) {
      return apiError("REFERRAL_STATUS_UPDATE_FAILED", error.message, 409);
    }
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
