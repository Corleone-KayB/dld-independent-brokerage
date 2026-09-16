import { connectionRequestSchema } from "@/lib/validations/network";
import { listMyConnections, requestConnection } from "@/modules/network/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requirePermission, ForbiddenError, UnauthorizedError, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";
import { RateLimitError } from "@/server/security/rate-limit";
import { writeAuditLog } from "@/server/audit/log";

export async function GET() {
  try {
    const user = await requirePermission(PERMISSIONS.NETWORK_CONNECT);
    if (!user.brokerId) throw new ForbiddenError("Only brokers can use the Independent Brokerage Network");

    const connections = await listMyConnections(user.brokerId);
    return apiSuccess(connections);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requirePermission(PERMISSIONS.NETWORK_CONNECT);
    if (!user.brokerId) throw new ForbiddenError("Only brokers can use the Independent Brokerage Network");

    const json = await request.json().catch(() => null);
    const parsed = connectionRequestSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 422);
    }

    const connection = await requestConnection(user.brokerId, parsed.data.targetBrokerId);

    await writeAuditLog({
      actorUserId: user.id,
      action: "NETWORK_CONNECTION_REQUESTED",
      entityType: "NetworkConnection",
      entityId: connection.id,
      partnerId: user.partnerId,
      metadata: { targetBrokerId: parsed.data.targetBrokerId },
    });

    return apiSuccess(connection, {}, 201);
  } catch (error) {
    if (error instanceof RateLimitError || error instanceof ForbiddenError || error instanceof UnauthorizedError) {
      const { status, body } = toErrorResponse(error);
      return Response.json(body, { status });
    }
    if (error instanceof Error) {
      return apiError("CONNECTION_REQUEST_FAILED", error.message, 409);
    }
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
