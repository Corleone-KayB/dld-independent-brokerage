import { listReviewsForBroker } from "@/modules/reputation/service";
import { apiSuccess } from "@/lib/utils/api-response";
import { requirePermission, ForbiddenError, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";

export async function GET() {
  try {
    const user = await requirePermission(PERMISSIONS.REVIEWS_SUBMIT);
    if (!user.brokerId) throw new ForbiddenError("Only brokers have reviews");

    const reviews = await listReviewsForBroker(user.brokerId);
    return apiSuccess(reviews);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
