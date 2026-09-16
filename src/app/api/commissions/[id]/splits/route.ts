import { commissionSplitCreateSchema } from "@/lib/validations/commission-split";
import { getCommission } from "@/modules/commissions/service";
import { listSplitsForCommission, createSplit } from "@/modules/commission-splits/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requirePermission, ForbiddenError, UnauthorizedError, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";
import { writeAuditLog } from "@/server/audit/log";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission(PERMISSIONS.COMMISSIONS_MANAGE);
    const { id } = await params;
    const existing = await getCommission(id);
    if (!existing) return apiError("NOT_FOUND", "Commission not found", 404);

    const splits = await listSplitsForCommission(id);
    return apiSuccess(splits);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(PERMISSIONS.COMMISSIONS_MANAGE);
    const { id } = await params;
    const existing = await getCommission(id);
    if (!existing) return apiError("NOT_FOUND", "Commission not found", 404);

    const json = await request.json().catch(() => null);
    const parsed = commissionSplitCreateSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 422);
    }

    const split = await createSplit(id, parsed.data);

    await writeAuditLog({
      actorUserId: user.id,
      action: "COMMISSION_SPLIT_CREATED",
      entityType: "CommissionSplit",
      entityId: split.id,
      partnerId: existing.partnerId,
      metadata: { commissionId: id, brokerId: parsed.data.brokerId, percent: parsed.data.percent },
    });

    return apiSuccess(split, {}, 201);
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof UnauthorizedError) {
      const { status, body } = toErrorResponse(error);
      return Response.json(body, { status });
    }
    if (error instanceof Error) {
      return apiError("COMMISSION_SPLIT_CREATE_FAILED", error.message, 409);
    }
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
