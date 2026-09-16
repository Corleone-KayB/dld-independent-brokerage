import { revokeConnection } from "@/modules/network/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requirePermission, ForbiddenError, UnauthorizedError, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";
import { writeAuditLog } from "@/server/audit/log";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(PERMISSIONS.NETWORK_CONNECT);
    if (!user.brokerId) throw new ForbiddenError("Only brokers can use the Independent Brokerage Network");
    const { id } = await params;

    const connection = await revokeConnection(id, user.brokerId);

    await writeAuditLog({
      actorUserId: user.id,
      action: "NETWORK_CONNECTION_REVOKED",
      entityType: "NetworkConnection",
      entityId: id,
      partnerId: user.partnerId,
    });

    return apiSuccess(connection);
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof UnauthorizedError) {
      const { status, body } = toErrorResponse(error);
      return Response.json(body, { status });
    }
    if (error instanceof Error) {
      return apiError("CONNECTION_REVOKE_FAILED", error.message, 409);
    }
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
