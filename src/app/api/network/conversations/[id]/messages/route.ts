import { messageSendSchema } from "@/lib/validations/network";
import { listMessages, sendMessage, markConversationRead } from "@/modules/messaging/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requirePermission, ForbiddenError, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(PERMISSIONS.NETWORK_MESSAGE);
    if (!user.brokerId) throw new ForbiddenError("Only brokers can use network messaging");
    const { id } = await params;

    const messages = await listMessages(id, user.brokerId);
    await markConversationRead(id, user.brokerId);
    return apiSuccess(messages);
  } catch (error) {
    if (error instanceof ForbiddenError) {
      const { status, body } = toErrorResponse(error);
      return Response.json(body, { status });
    }
    if (error instanceof Error) {
      return apiError("CONVERSATION_NOT_FOUND", error.message, 404);
    }
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(PERMISSIONS.NETWORK_MESSAGE);
    if (!user.brokerId) throw new ForbiddenError("Only brokers can use network messaging");
    const { id } = await params;

    const json = await request.json().catch(() => null);
    const parsed = messageSendSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 422);
    }

    const message = await sendMessage(id, user.brokerId, parsed.data.body);
    return apiSuccess(message, {}, 201);
  } catch (error) {
    if (error instanceof ForbiddenError) {
      const { status, body } = toErrorResponse(error);
      return Response.json(body, { status });
    }
    if (error instanceof Error) {
      return apiError("MESSAGE_SEND_FAILED", error.message, 409);
    }
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
