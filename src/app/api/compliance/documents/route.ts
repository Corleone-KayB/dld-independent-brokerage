import crypto from "node:crypto";
import { complianceDocumentTypeEnum } from "@/lib/validations/compliance";
import { createComplianceDocument } from "@/modules/compliance/service";
import { storage } from "@/server/storage";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requireSessionUser, ForbiddenError, toErrorResponse } from "@/server/rbac/guard";
import { anyRoleHasPermission, PERMISSIONS } from "@/server/rbac/permissions";
import { writeAuditLog } from "@/server/audit/log";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    if (!user.partnerId && !anyRoleHasPermission(user.roles, PERMISSIONS.COMPLIANCE_VERIFY_DOCUMENTS)) {
      throw new ForbiddenError("No partner scope on this account");
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const partnerId = (formData.get("partnerId") as string | null) ?? user.partnerId;
    const type = complianceDocumentTypeEnum.safeParse(formData.get("type"));
    const name = formData.get("name");
    const expiresAtRaw = formData.get("expiresAt");

    if (!(file instanceof File)) return apiError("VALIDATION_ERROR", "A file is required", 422);
    if (file.size > MAX_FILE_BYTES) return apiError("VALIDATION_ERROR", "File exceeds 10MB limit", 422);
    if (!type.success) return apiError("VALIDATION_ERROR", "A valid document type is required", 422);
    if (typeof name !== "string" || name.trim().length === 0) {
      return apiError("VALIDATION_ERROR", "Document name is required", 422);
    }
    if (!partnerId) return apiError("VALIDATION_ERROR", "partnerId is required", 422);

    if (partnerId !== user.partnerId && !anyRoleHasPermission(user.roles, PERMISSIONS.COMPLIANCE_VERIFY_DOCUMENTS)) {
      throw new ForbiddenError();
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const storageKey = `compliance/${partnerId}/${crypto.randomUUID()}-${file.name}`;
    await storage.upload({ key: storageKey, buffer, mimeType: file.type || "application/octet-stream" });

    const document = await createComplianceDocument({
      partnerId,
      type: type.data,
      name,
      storageKey,
      mimeType: file.type || undefined,
      expiresAt: expiresAtRaw ? new Date(String(expiresAtRaw)) : undefined,
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "COMPLIANCE_DOCUMENT_UPLOADED",
      entityType: "ComplianceDocument",
      entityId: document.id,
      partnerId,
    });

    return apiSuccess(document, {}, 201);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
