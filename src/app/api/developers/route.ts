import { listDevelopers } from "@/modules/developers/service";
import { apiSuccess } from "@/lib/utils/api-response";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") ? Number(searchParams.get("page")) : undefined;
  const result = await listDevelopers({ page });
  return apiSuccess(result.items, {
    page: result.page,
    pageSize: result.pageSize,
    total: result.total,
    totalPages: result.totalPages,
  });
}
