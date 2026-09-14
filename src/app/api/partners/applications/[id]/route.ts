import { getApplication } from "@/modules/partners/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requirePermission, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission(PERMISSIONS.PARTNERS_VIEW_APPLICATIONS);
    const { id } = await params;
    const application = await getApplication(id);
    if (!application) return apiError("NOT_FOUND", "Application not found", 404);
    return apiSuccess(application);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
