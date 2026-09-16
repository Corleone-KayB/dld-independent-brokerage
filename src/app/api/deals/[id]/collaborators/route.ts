import { collaboratorInviteSchema } from "@/lib/validations/deal-collaboration";
import { getDeal } from "@/modules/deals/service";
import { listCollaborators, inviteCollaborator } from "@/modules/deal-collaboration/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requireAnyPermission, ownsPartnerResource, ForbiddenError, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";
import { RateLimitError } from "@/server/security/rate-limit";
import { writeAuditLog } from "@/server/audit/log";

async function authorizeDealOwnerOrAdmin(
  user: Awaited<ReturnType<typeof requireAnyPermission>>,
  dealId: string,
) {
  const deal = await getDeal(dealId);
  if (!deal) return { deal: null, authorized: false };
  const authorized =
    ownsPartnerResource(user, deal.partnerId, PERMISSIONS.DEALS_MANAGE_ALL) ||
    (!!user.brokerId && user.brokerId === deal.brokerId);
  return { deal, authorized };
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAnyPermission([PERMISSIONS.DEALS_COLLABORATE, PERMISSIONS.DEALS_MANAGE_ALL]);
    const { id } = await params;
    const { deal, authorized } = await authorizeDealOwnerOrAdmin(user, id);
    if (!deal) return apiError("NOT_FOUND", "Deal not found", 404);
    if (!authorized) throw new ForbiddenError();

    const collaborators = await listCollaborators(id);
    return apiSuccess(collaborators);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAnyPermission([PERMISSIONS.DEALS_COLLABORATE, PERMISSIONS.DEALS_MANAGE_ALL]);
    const { id } = await params;
    const { deal, authorized } = await authorizeDealOwnerOrAdmin(user, id);
    if (!deal) return apiError("NOT_FOUND", "Deal not found", 404);
    if (!authorized) throw new ForbiddenError("Only the deal's own broker can invite collaborators");

    const json = await request.json().catch(() => null);
    const parsed = collaboratorInviteSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 422);
    }

    const collaborator = await inviteCollaborator(id, user.id, parsed.data);

    await writeAuditLog({
      actorUserId: user.id,
      action: "DEAL_COLLABORATION_INVITED",
      entityType: "DealCollaborator",
      entityId: collaborator.id,
      partnerId: user.partnerId,
      metadata: { dealId: id, brokerId: parsed.data.brokerId, role: parsed.data.role },
    });

    return apiSuccess(collaborator, {}, 201);
  } catch (error) {
    if (error instanceof RateLimitError || error instanceof ForbiddenError) {
      const { status, body } = toErrorResponse(error);
      return Response.json(body, { status });
    }
    if (error instanceof Error) {
      return apiError("COLLABORATOR_INVITE_FAILED", error.message, 409);
    }
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
