import { reviewCreateSchema } from "@/lib/validations/reputation";
import { createReview, listReviewableForBroker } from "@/modules/reputation/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requirePermission, ForbiddenError, UnauthorizedError, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";
import { writeAuditLog } from "@/server/audit/log";

export async function GET() {
  try {
    const user = await requirePermission(PERMISSIONS.REVIEWS_SUBMIT);
    if (!user.brokerId) throw new ForbiddenError("Only brokers can leave reviews");

    const reviewable = await listReviewableForBroker(user.brokerId);
    return apiSuccess(reviewable);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requirePermission(PERMISSIONS.REVIEWS_SUBMIT);
    if (!user.brokerId) throw new ForbiddenError("Only brokers can leave reviews");

    const json = await request.json().catch(() => null);
    const parsed = reviewCreateSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 422);
    }

    const review = await createReview(user.brokerId, parsed.data);

    await writeAuditLog({
      actorUserId: user.id,
      action: "BROKER_REVIEW_SUBMITTED",
      entityType: "BrokerReview",
      entityId: review.id,
      partnerId: user.partnerId,
      metadata: { revieweeBrokerId: parsed.data.revieweeBrokerId, rating: parsed.data.rating },
    });

    return apiSuccess(review, {}, 201);
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof UnauthorizedError) {
      const { status, body } = toErrorResponse(error);
      return Response.json(body, { status });
    }
    if (error instanceof Error) {
      return apiError("REVIEW_CREATE_FAILED", error.message, 409);
    }
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
