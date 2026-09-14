import { blogPostCreateSchema } from "@/lib/validations/marketing";
import { listBlogPosts, createBlogPost } from "@/modules/marketing/service";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { requirePermission, toErrorResponse } from "@/server/rbac/guard";
import { PERMISSIONS } from "@/server/rbac/permissions";
import { writeAuditLog } from "@/server/audit/log";

export async function GET() {
  const posts = await listBlogPosts({ publicOnly: true });
  return apiSuccess(posts);
}

export async function POST(request: Request) {
  try {
    const user = await requirePermission(PERMISSIONS.MARKETING_MANAGE);
    const json = await request.json().catch(() => null);
    const parsed = blogPostCreateSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 422);
    }

    const post = await createBlogPost(user.id, parsed.data);

    await writeAuditLog({
      actorUserId: user.id,
      action: "BLOG_POST_CREATED",
      entityType: "BlogPost",
      entityId: post.id,
    });

    return apiSuccess(post, {}, 201);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return Response.json(body, { status });
  }
}
