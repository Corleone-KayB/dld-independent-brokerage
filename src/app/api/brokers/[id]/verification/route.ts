import { getBrokerById } from "@/modules/brokers/service";
import { describeVerification } from "@/server/dld/verification";
import { dldConfig } from "@/server/dld/config";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const broker = await getBrokerById(id);
  if (!broker) return apiError("NOT_FOUND", "Broker not found", 404);

  const display = describeVerification(broker.verificationStatus, broker.lastVerifiedAt);
  return apiSuccess({
    status: broker.verificationStatus,
    label: display.label,
    description: display.description,
    lastVerifiedAt: broker.lastVerifiedAt,
    officialVerificationUrl: broker.officialVerificationUrl || dldConfig.officialVerificationUrl || null,
  });
}
