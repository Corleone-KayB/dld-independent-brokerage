import { leadCreateSchema } from "@/lib/validations/crm";
import { listLeads, createLead } from "@/modules/leads/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requirePermission, toErrorResponse, ForbiddenError } from "@/server/rbac/guard";
import { anyRoleHasPermission, PERMISSIONS } from "@/server/rbac/permissions";
import { writeAuditLog } from "@/server/audit/log";
import type { LeadStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const user = await requirePermission(PERMISSIONS.LEADS_MANAGE_OWN);
    const { searchParams } = new URL(request.url);
    const status = (searchParams.get("status") as LeadStatus | null) ?? undefined;

    const canManageAll = anyRoleHasPermission(user.roles, PERMISSIONS.PROPERTIES_MANAGE_ALL);
    const leads = await listLeads({
      partnerId: canManageAll ? undefined : user.partnerId ?? undefined,
      brokerId: canManageAll ? undefined : user.brokerId ?? undefined,
      status,
    });
    return apiSuccess(leads);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requirePermission(PERMISSIONS.LEADS_MANAGE_OWN);
    if (!user.partnerId) throw new ForbiddenError("No partner scope on this account");

    const json = await request.json().catch(() => null);
    const parsed = leadCreateSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 422);
    }

    const lead = await createLead(user.partnerId, parsed.data);

    await writeAuditLog({
      actorUserId: user.id,
      action: "LEAD_CREATED",
      entityType: "Lead",
      entityId: lead.id,
      partnerId: user.partnerId,
    });

    return apiSuccess(lead, {}, 201);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
