import { getComplianceDocument } from "@/modules/compliance/service";
import { storage } from "@/server/storage";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requireSessionUser, ownsPartnerResource, ForbiddenError, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSessionUser();
    const { id } = await params;
    const document = await getComplianceDocument(id);
    if (!document) return apiError("NOT_FOUND", "Document not found", 404);
    if (!ownsPartnerResource(user, document.partnerId, PERMISSIONS.COMPLIANCE_VERIFY_DOCUMENTS)) {
      throw new ForbiddenError();
    }

    const url = await storage.getSignedUrl(document.storageKey);
    return apiSuccess({ ...document, url });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
