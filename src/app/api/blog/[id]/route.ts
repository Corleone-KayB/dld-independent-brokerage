import { blogPostUpdateSchema } from "@/lib/validations/marketing";
import { getBlogPostById, updateBlogPost, deleteBlogPost } from "@/modules/marketing/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requirePermission, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";
import { writeAuditLog } from "@/server/audit/log";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission(PERMISSIONS.MARKETING_MANAGE);
    const { id } = await params;
    const post = await getBlogPostById(id);
    if (!post) return apiError("NOT_FOUND", "Post not found", 404);
    return apiSuccess(post);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(PERMISSIONS.MARKETING_MANAGE);
    const { id } = await params;
    const existing = await getBlogPostById(id);
    if (!existing) return apiError("NOT_FOUND", "Post not found", 404);

    const json = await request.json().catch(() => null);
    const parsed = blogPostUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 422);
    }

    const post = await updateBlogPost(id, parsed.data);

    await writeAuditLog({
      actorUserId: user.id,
      action: "BLOG_POST_UPDATED",
      entityType: "BlogPost",
      entityId: id,
      metadata: { status: parsed.data.status ?? null },
    });

    return apiSuccess(post);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(PERMISSIONS.MARKETING_MANAGE);
    const { id } = await params;
    const existing = await getBlogPostById(id);
    if (!existing) return apiError("NOT_FOUND", "Post not found", 404);

    await deleteBlogPost(id);

    await writeAuditLog({
      actorUserId: user.id,
      action: "BLOG_POST_DELETED",
      entityType: "BlogPost",
      entityId: id,
    });

    return apiSuccess({ id });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
