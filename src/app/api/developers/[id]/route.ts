import { prisma } from "@/server/db/client";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const developer = await prisma.developer.findUnique({ where: { id }, include: { projects: true } });
  if (!developer) return apiError("NOT_FOUND", "Developer not found", 404);
  return apiSuccess(developer);
}
