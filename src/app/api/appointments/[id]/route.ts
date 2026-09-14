import { appointmentUpdateSchema } from "@/lib/validations/crm";
import { updateAppointment } from "@/modules/crm/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requirePermission, ownsPartnerResource, ForbiddenError, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";
import { writeAuditLog } from "@/server/audit/log";
import { prisma } from "@/server/db/client";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(PERMISSIONS.LEADS_MANAGE_OWN);
    const { id } = await params;
    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) return apiError("NOT_FOUND", "Appointment not found", 404);
    if (!ownsPartnerResource(user, existing.partnerId, PERMISSIONS.PROPERTIES_MANAGE_ALL)) {
      throw new ForbiddenError();
    }

    const json = await request.json().catch(() => null);
    const parsed = appointmentUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 422);
    }

    const appointment = await updateAppointment(id, parsed.data);

    await writeAuditLog({
      actorUserId: user.id,
      action: "APPOINTMENT_UPDATED",
      entityType: "Appointment",
      entityId: id,
      partnerId: user.partnerId,
    });

    return apiSuccess(appointment);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
