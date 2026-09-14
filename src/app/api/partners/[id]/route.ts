import { getPartnerById } from "@/modules/partners/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requirePermission, ownsPartnerResource, toErrorResponse, ForbiddenError } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requirePermission(PERMISSIONS.CLIENTS_VIEW_OWN);
    if (!ownsPartnerResource(user, id, PERMISSIONS.PARTNERS_VIEW_APPLICATIONS)) {
      throw new ForbiddenError();
    }
    const partner = await getPartnerById(id);
    if (!partner) return apiError("NOT_FOUND", "Partner not found", 404);
    return apiSuccess(partner);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
