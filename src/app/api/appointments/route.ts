import { appointmentCreateSchema } from "@/lib/validations/crm";
import { listAppointments, createAppointment } from "@/modules/crm/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requirePermission, toErrorResponse, ForbiddenError } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";
import { writeAuditLog } from "@/server/audit/log";

export async function GET() {
  try {
    const user = await requirePermission(PERMISSIONS.LEADS_MANAGE_OWN);
    if (!user.partnerId) throw new ForbiddenError("No partner scope on this account");
    const appointments = await listAppointments({
      partnerId: user.partnerId,
      brokerId: user.brokerId ?? undefined,
    });
    return apiSuccess(appointments);
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
    const parsed = appointmentCreateSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 422);
    }

    const appointment = await createAppointment(user.partnerId, parsed.data);

    await writeAuditLog({
      actorUserId: user.id,
      action: "APPOINTMENT_CREATED",
      entityType: "Appointment",
      entityId: appointment.id,
      partnerId: user.partnerId,
    });

    return apiSuccess(appointment, {}, 201);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
