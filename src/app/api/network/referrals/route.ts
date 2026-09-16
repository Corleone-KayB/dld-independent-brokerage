import { referralCreateSchema } from "@/lib/validations/network";
import { listMyReferrals, createReferral } from "@/modules/referrals/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requirePermission, ForbiddenError, UnauthorizedError, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";
import { RateLimitError } from "@/server/security/rate-limit";
import { writeAuditLog } from "@/server/audit/log";

export async function GET() {
  try {
    const user = await requirePermission(PERMISSIONS.REFERRALS_MANAGE_OWN);
    if (!user.brokerId) throw new ForbiddenError("Only brokers can use referrals");

    const referrals = await listMyReferrals(user.brokerId);
    return apiSuccess(referrals);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requirePermission(PERMISSIONS.REFERRALS_MANAGE_OWN);
    if (!user.brokerId) throw new ForbiddenError("Only brokers can use referrals");

    const json = await request.json().catch(() => null);
    const parsed = referralCreateSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 422);
    }

    const referral = await createReferral(user.brokerId, parsed.data);

    await writeAuditLog({
      actorUserId: user.id,
      action: "REFERRAL_SENT",
      entityType: "Referral",
      entityId: referral.id,
      partnerId: user.partnerId,
      metadata: { receivingBrokerId: parsed.data.receivingBrokerId },
    });

    return apiSuccess(referral, {}, 201);
  } catch (error) {
    if (error instanceof RateLimitError || error instanceof ForbiddenError || error instanceof UnauthorizedError) {
      const { status, body } = toErrorResponse(error);
      return Response.json(body, { status });
    }
    if (error instanceof Error) {
      return apiError("REFERRAL_CREATE_FAILED", error.message, 409);
    }
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
