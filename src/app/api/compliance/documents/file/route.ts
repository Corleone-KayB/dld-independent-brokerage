import { storage, verifySignedKey } from "@/server/storage";
import { requireSessionUser, ownsPartnerResource, ForbiddenError, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";
import { prisma } from "@/server/db/client";
import { apiError } from "@/lib/utils/api-response";

/**
 * Serves private compliance documents. Never public: requires both a valid
 * signed key/token AND an authenticated session with document access.
 */
export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    const expiresAt = Number(searchParams.get("expiresAt"));
    const signature = searchParams.get("signature");

    if (!key || !expiresAt || !signature || !verifySignedKey(key, expiresAt, signature)) {
      return apiError("INVALID_OR_EXPIRED_LINK", "This document link is invalid or has expired", 403);
    }

    const document = await prisma.complianceDocument.findFirst({ where: { storageKey: key } });
    if (!document) return apiError("NOT_FOUND", "Document not found", 404);
    if (!ownsPartnerResource(user, document.partnerId, PERMISSIONS.COMPLIANCE_VERIFY_DOCUMENTS)) {
      throw new ForbiddenError();
    }

    const buffer = await storage.read(key);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": document.mimeType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${document.name}"`,
        "Cache-Control": "private, max-age=0, no-store",
      },
    });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
