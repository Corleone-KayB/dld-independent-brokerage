import { activityCreateSchema } from "@/lib/validations/crm";
import { createActivity, getClient } from "@/modules/crm/service";
import { getLead } from "@/modules/leads/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requirePermission, ownsPartnerResource, ForbiddenError, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";

export async function POST(request: Request) {
  try {
    const user = await requirePermission(PERMISSIONS.LEADS_MANAGE_OWN);
    const json = await request.json().catch(() => null);
    const parsed = activityCreateSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 422);
    }

    if (parsed.data.clientId) {
      const client = await getClient(parsed.data.clientId);
      if (!client) return apiError("NOT_FOUND", "Client not found", 404);
      if (!ownsPartnerResource(user, client.partnerId, PERMISSIONS.PROPERTIES_MANAGE_ALL)) {
        throw new ForbiddenError();
      }
    }
    if (parsed.data.leadId) {
      const lead = await getLead(parsed.data.leadId);
      if (!lead) return apiError("NOT_FOUND", "Lead not found", 404);
      if (!ownsPartnerResource(user, lead.partnerId, PERMISSIONS.PROPERTIES_MANAGE_ALL)) {
        throw new ForbiddenError();
      }
    }

    const activity = await createActivity(user.id, parsed.data);
    return apiSuccess(activity, {}, 201);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
