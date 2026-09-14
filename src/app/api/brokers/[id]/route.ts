import { getBrokerById } from "@/modules/brokers/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const broker = await getBrokerById(id);
  if (!broker) return apiError("NOT_FOUND", "Broker not found", 404);
  return apiSuccess(broker);
}
