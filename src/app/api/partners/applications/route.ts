import { listApplications } from "@/modules/partners/service";
import { apiSuccess } from "@/lib/utils/api-response";
import { requirePermission, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";
import type { PartnerStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    await requirePermission(PERMISSIONS.PARTNERS_VIEW_APPLICATIONS);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as PartnerStatus | null;
    const page = searchParams.get("page") ? Number(searchParams.get("page")) : undefined;

    const result = await listApplications({ status: status ?? undefined, page });
    return apiSuccess(result.items, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
