import { conversationStartSchema } from "@/lib/validations/network";
import { listConversationsForBroker, getOrCreateConversation } from "@/modules/messaging/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requirePermission, ForbiddenError, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";

export async function GET() {
  try {
    const user = await requirePermission(PERMISSIONS.NETWORK_MESSAGE);
    if (!user.brokerId) throw new ForbiddenError("Only brokers can use network messaging");

    const conversations = await listConversationsForBroker(user.brokerId);
    return apiSuccess(conversations);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requirePermission(PERMISSIONS.NETWORK_MESSAGE);
    if (!user.brokerId) throw new ForbiddenError("Only brokers can use network messaging");

    const json = await request.json().catch(() => null);
    const parsed = conversationStartSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 422);
    }

    const conversation = await getOrCreateConversation(user.brokerId, parsed.data.brokerId);
    return apiSuccess(conversation, {}, 201);
  } catch (error) {
    if (error instanceof ForbiddenError) {
      const { status, body } = toErrorResponse(error);
      return Response.json(body, { status });
    }
    if (error instanceof Error) {
      return apiError("CONVERSATION_START_FAILED", error.message, 409);
    }
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
