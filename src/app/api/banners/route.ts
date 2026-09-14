import { bannerCreateSchema } from "@/lib/validations/marketing";
import { listActiveBanners, createBanner } from "@/modules/marketing/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requirePermission, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";
import { writeAuditLog } from "@/server/audit/log";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const placement = searchParams.get("placement") ?? "HOMEPAGE";
  const banners = await listActiveBanners(placement);
  return apiSuccess(banners);
}

export async function POST(request: Request) {
  try {
    const user = await requirePermission(PERMISSIONS.MARKETING_MANAGE);
    const json = await request.json().catch(() => null);
    const parsed = bannerCreateSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 422);
    }

    const banner = await createBanner(parsed.data);

    await writeAuditLog({
      actorUserId: user.id,
      action: "BANNER_CREATED",
      entityType: "Banner",
      entityId: banner.id,
    });

    return apiSuccess(banner, {}, 201);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
