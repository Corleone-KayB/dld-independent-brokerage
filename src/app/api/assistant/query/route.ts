import { brokerAssistantQuerySchema } from "@/lib/validations/assistant";
import { parseBrokerQuery, runBrokerQuery } from "@/server/assistant/broker-assistant";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requirePermission, ForbiddenError, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";

/** AI Broker Assistant — structured search over the broker's own CRM/inventory. */
export async function POST(request: Request) {
  try {
    const user = await requirePermission(PERMISSIONS.LEADS_MANAGE_OWN);
    if (!user.partnerId) throw new ForbiddenError("No partner scope on this account");

    const json = await request.json().catch(() => null);
    const parsed = brokerAssistantQuerySchema.safeParse(json);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 422);
    }

    const parsedQuery = parseBrokerQuery(parsed.data.query);
    const results = await runBrokerQuery(user.partnerId, parsedQuery);

    return apiSuccess({ parsedQuery, ...results });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
