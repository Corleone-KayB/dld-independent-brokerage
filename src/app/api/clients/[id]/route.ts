import { clientUpdateSchema } from "@/lib/validations/crm";
import { getClient, updateClient } from "@/modules/crm/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requirePermission, ownsPartnerResource, toErrorResponse, ForbiddenError } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";
import { writeAuditLog } from "@/server/audit/log";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(PERMISSIONS.CLIENTS_VIEW_OWN);
    const { id } = await params;
    const client = await getClient(id);
    if (!client) return apiError("NOT_FOUND", "Client not found", 404);
    if (!ownsPartnerResource(user, client.partnerId, PERMISSIONS.PROPERTIES_MANAGE_ALL)) {
      throw new ForbiddenError();
    }
    return apiSuccess(client);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(PERMISSIONS.CLIENTS_VIEW_OWN);
    const { id } = await params;
    const existing = await getClient(id);
    if (!existing) return apiError("NOT_FOUND", "Client not found", 404);
    if (!ownsPartnerResource(user, existing.partnerId, PERMISSIONS.PROPERTIES_MANAGE_ALL)) {
      throw new ForbiddenError();
    }

    const json = await request.json().catch(() => null);
    const parsed = clientUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 422);
    }

    const client = await updateClient(id, parsed.data);

    await writeAuditLog({
      actorUserId: user.id,
      action: "CLIENT_UPDATED",
      entityType: "Client",
      entityId: id,
      partnerId: user.partnerId,
    });

    return apiSuccess(client);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
