import { partnerStatusUpdateSchema } from "@/lib/validations/partner";
import { updateApplicationStatus } from "@/modules/partners/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requirePermission, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";
import { writeAuditLog } from "@/server/audit/log";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(PERMISSIONS.PARTNERS_APPROVE_REJECT);
    const { id } = await params;
    const json = await request.json().catch(() => null);
    const parsed = partnerStatusUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 422);
    }

    const application = await updateApplicationStatus(id, parsed.data.status, parsed.data.reviewNotes);

    await writeAuditLog({
      actorUserId: user.id,
      action: "PARTNER_APPLICATION_STATUS_CHANGED",
      entityType: "PartnerApplication",
      entityId: id,
      applicationId: id,
      metadata: { status: parsed.data.status, reviewNotes: parsed.data.reviewNotes ?? null },
    });

    return apiSuccess(application);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
