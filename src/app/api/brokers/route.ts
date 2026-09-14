import { searchBrokers } from "@/modules/brokers/service";
import { apiSuccess } from "@/lib/utils/api-response";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const result = await searchBrokers({
    area: searchParams.get("area") ?? undefined,
    specialization: searchParams.get("specialization") ?? undefined,
    language: searchParams.get("language") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
    pageSize: searchParams.get("pageSize") ? Number(searchParams.get("pageSize")) : undefined,
  });

  return apiSuccess(result.items, {
    page: result.page,
    pageSize: result.pageSize,
    total: result.total,
    totalPages: result.totalPages,
  });
}
