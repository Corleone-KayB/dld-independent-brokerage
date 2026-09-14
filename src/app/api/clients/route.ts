import { clientCreateSchema } from "@/lib/validations/crm";
import { listClients, createClient } from "@/modules/crm/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requirePermission, toErrorResponse, ForbiddenError } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";
import { writeAuditLog } from "@/server/audit/log";

export async function GET() {
  try {
    const user = await requirePermission(PERMISSIONS.CLIENTS_VIEW_OWN);
    if (!user.partnerId) throw new ForbiddenError("No partner scope on this account");
    const clients = await listClients(user.partnerId);
    return apiSuccess(clients);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requirePermission(PERMISSIONS.CLIENTS_VIEW_OWN);
    if (!user.partnerId) throw new ForbiddenError("No partner scope on this account");

    const json = await request.json().catch(() => null);
    const parsed = clientCreateSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 422);
    }

    const client = await createClient(user.partnerId, parsed.data);

    await writeAuditLog({
      actorUserId: user.id,
      action: "CLIENT_CREATED",
      entityType: "Client",
      entityId: client.id,
      partnerId: user.partnerId,
    });

    return apiSuccess(client, {}, 201);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
