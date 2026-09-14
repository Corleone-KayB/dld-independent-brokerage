import { leadAssignSchema } from "@/lib/validations/crm";
import { assignLead, getLead } from "@/modules/leads/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requirePermission, ownsPartnerResource, toErrorResponse, ForbiddenError } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";
import { writeAuditLog } from "@/server/audit/log";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(PERMISSIONS.LEADS_ASSIGN);
    const { id } = await params;
    const existing = await getLead(id);
    if (!existing) return apiError("NOT_FOUND", "Lead not found", 404);
    if (!ownsPartnerResource(user, existing.partnerId, PERMISSIONS.PROPERTIES_MANAGE_ALL)) {
      throw new ForbiddenError();
    }

    const json = await request.json().catch(() => null);
    const parsed = leadAssignSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 422);
    }

    const lead = await assignLead(id, parsed.data.brokerId);

    await writeAuditLog({
      actorUserId: user.id,
      action: "LEAD_ASSIGNED",
      entityType: "Lead",
      entityId: id,
      partnerId: user.partnerId,
      metadata: { brokerId: parsed.data.brokerId },
    });

    return apiSuccess(lead);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
