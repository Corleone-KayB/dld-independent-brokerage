import { propertySearchSchema, propertyCreateSchema } from "@/lib/validations/property";
import { searchProperties, createProperty } from "@/modules/properties/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requirePermission, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";
import { writeAuditLog } from "@/server/audit/log";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = propertySearchSchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid query", 422);
  }

  const result = await searchProperties(parsed.data, { publicOnly: true });
  return apiSuccess(result.items, {
    page: result.page,
    pageSize: result.pageSize,
    total: result.total,
    totalPages: result.totalPages,
  });
}

export async function POST(request: Request) {
  try {
    const user = await requirePermission(PERMISSIONS.PROPERTIES_MANAGE_OWN);
    const json = await request.json().catch(() => null);
    const parsed = propertyCreateSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 422);
    }

    const property = await createProperty(parsed.data, {
      partnerId: user.partnerId,
      brokerId: user.brokerId,
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "PROPERTY_CREATED",
      entityType: "Property",
      entityId: property.id,
      partnerId: user.partnerId,
    });

    return apiSuccess(property, {}, 201);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
