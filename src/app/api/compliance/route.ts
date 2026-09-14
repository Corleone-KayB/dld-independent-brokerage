import { listComplianceDocuments, listAllComplianceDocuments } from "@/modules/compliance/service";
import { apiSuccess } from "@/lib/utils/api-response";
import { requireSessionUser, toErrorResponse, ForbiddenError } from "@/server/rbac/guard";
import { anyRoleHasPermission, PERMISSIONS } from "@/server/rbac/permissions";

export async function GET() {
  try {
    const user = await requireSessionUser();
    const canViewAll = anyRoleHasPermission(user.roles, PERMISSIONS.COMPLIANCE_VERIFY_DOCUMENTS);
    const canViewOwn = anyRoleHasPermission(user.roles, PERMISSIONS.CLIENTS_VIEW_OWN);

    if (canViewAll) {
      const documents = await listAllComplianceDocuments();
      return apiSuccess(documents);
    }

    if (!canViewOwn) throw new ForbiddenError();
    if (!user.partnerId) return apiSuccess([]);
    const documents = await listComplianceDocuments(user.partnerId);
    return apiSuccess(documents);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
