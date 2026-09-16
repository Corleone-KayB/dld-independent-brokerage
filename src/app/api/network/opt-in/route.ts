import { networkOptInSchema } from "@/lib/validations/network";
import { setNetworkOptIn } from "@/modules/network/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requirePermission, ForbiddenError, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";
import { writeAuditLog } from "@/server/audit/log";

export async function PATCH(request: Request) {
  try {
    const user = await requirePermission(PERMISSIONS.NETWORK_CONNECT);
    if (!user.brokerId) throw new ForbiddenError("Only brokers can join the Independent Brokerage Network");

    const json = await request.json().catch(() => null);
    const parsed = networkOptInSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 422);
    }

    const broker = await setNetworkOptIn(user.brokerId, parsed.data.optIn);

    await writeAuditLog({
      actorUserId: user.id,
      action: parsed.data.optIn ? "NETWORK_OPT_IN" : "NETWORK_OPT_OUT",
      entityType: "Broker",
      entityId: user.brokerId,
      partnerId: user.partnerId,
    });

    return apiSuccess(broker);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
