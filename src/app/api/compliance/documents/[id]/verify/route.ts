import { complianceDocumentVerifySchema } from "@/lib/validations/compliance";
import { verifyComplianceDocument, getComplianceDocument } from "@/modules/compliance/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requirePermission, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";
import { writeAuditLog } from "@/server/audit/log";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(PERMISSIONS.COMPLIANCE_VERIFY_DOCUMENTS);
    const { id } = await params;
    const existing = await getComplianceDocument(id);
    if (!existing) return apiError("NOT_FOUND", "Document not found", 404);

    const json = await request.json().catch(() => null);
    const parsed = complianceDocumentVerifySchema.safeParse(json);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 422);
    }
    if (parsed.data.verificationStatus === "PENDING") {
      return apiError("VALIDATION_ERROR", "Cannot set status back to PENDING via verify", 422);
    }

    const document = await verifyComplianceDocument(
      id,
      user.id,
      parsed.data.verificationStatus as "PLATFORM_VERIFIED" | "REJECTED" | "EXPIRED",
    );

    await writeAuditLog({
      actorUserId: user.id,
      action: "COMPLIANCE_DOCUMENT_VERIFIED",
      entityType: "ComplianceDocument",
      entityId: id,
      partnerId: document.partnerId,
      metadata: { verificationStatus: parsed.data.verificationStatus },
    });

    return apiSuccess(document);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
