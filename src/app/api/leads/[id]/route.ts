import { leadUpdateSchema } from "@/lib/validations/crm";
import { getLead, updateLead } from "@/modules/leads/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requirePermission, ownsPartnerResource, toErrorResponse, ForbiddenError } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";
import { writeAuditLog } from "@/server/audit/log";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(PERMISSIONS.LEADS_MANAGE_OWN);
    const { id } = await params;
    const lead = await getLead(id);
    if (!lead) return apiError("NOT_FOUND", "Lead not found", 404);

    const owned =
      ownsPartnerResource(user, lead.partnerId, PERMISSIONS.PROPERTIES_MANAGE_ALL) ||
      (!!user.brokerId && user.brokerId === lead.brokerId);
    if (!owned) throw new ForbiddenError();

    return apiSuccess(lead);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(PERMISSIONS.LEADS_MANAGE_OWN);
    const { id } = await params;
    const existing = await getLead(id);
    if (!existing) return apiError("NOT_FOUND", "Lead not found", 404);

    const owned =
      ownsPartnerResource(user, existing.partnerId, PERMISSIONS.PROPERTIES_MANAGE_ALL) ||
      (!!user.brokerId && user.brokerId === existing.brokerId);
    if (!owned) throw new ForbiddenError();

    const json = await request.json().catch(() => null);
    const parsed = leadUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 422);
    }

    const lead = await updateLead(id, parsed.data);

    await writeAuditLog({
      actorUserId: user.id,
      action: "LEAD_UPDATED",
      entityType: "Lead",
      entityId: id,
      partnerId: user.partnerId,
      metadata: { status: parsed.data.status ?? null },
    });

    return apiSuccess(lead);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
