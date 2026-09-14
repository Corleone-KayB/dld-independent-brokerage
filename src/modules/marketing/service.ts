import "server-only";
import { prisma } from "@/server/db/client";
import { slugify } from "@/lib/utils/format";
import type { BlogPostCreateInput, BlogPostUpdateInput, BannerCreateInput, BannerUpdateInput } from "@/lib/validations/marketing";

async function uniqueBlogSlug(title: string) {
  const base = slugify(title);
  let candidate = base || "post";
  let counter = 1;
  while (await prisma.blogPost.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }
  return candidate;
}

export async function listBlogPosts(opts: { publicOnly?: boolean } = {}) {
  const publicOnly = opts.publicOnly ?? true;
  return prisma.blogPost.findMany({
    where: publicOnly ? { status: "PUBLISHED" } : {},
    orderBy: { createdAt: "desc" },
  });
}

export async function getBlogPostBySlug(slug: string, opts: { publicOnly?: boolean } = {}) {
  const publicOnly = opts.publicOnly ?? true;
  return prisma.blogPost.findFirst({ where: { slug, ...(publicOnly ? { status: "PUBLISHED" } : {}) } });
}

export async function getBlogPostById(id: string) {
  return prisma.blogPost.findUnique({ where: { id } });
}

export async function createBlogPost(authorId: string, input: BlogPostCreateInput) {
  const slug = await uniqueBlogSlug(input.title);
  return prisma.blogPost.create({
    data: {
      slug,
      title: input.title,
      excerpt: input.excerpt,
      content: input.content,
      coverImageUrl: input.coverImageUrl || undefined,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      authorId,
      status: "DRAFT",
    },
  });
}

export async function updateBlogPost(id: string, input: BlogPostUpdateInput) {
  return prisma.blogPost.update({
    where: { id },
    data: {
      ...input,
      coverImageUrl: input.coverImageUrl || undefined,
      publishedAt: input.status === "PUBLISHED" ? new Date() : undefined,
    },
  });
}

export async function deleteBlogPost(id: string) {
  return prisma.blogPost.delete({ where: { id } });
}

export async function listActiveBanners(placement = "HOMEPAGE") {
  const now = new Date();
  return prisma.banner.findMany({
    where: {
      placement,
      isActive: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    },
    orderBy: { sortOrder: "asc" },
  });
}

export async function listAllBanners() {
  return prisma.banner.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function createBanner(input: BannerCreateInput) {
  return prisma.banner.create({
    data: { ...input, imageUrl: input.imageUrl || undefined, ctaHref: input.ctaHref || undefined },
  });
}

export async function updateBanner(id: string, input: BannerUpdateInput) {
  return prisma.banner.update({
    where: { id },
    data: { ...input, imageUrl: input.imageUrl || undefined, ctaHref: input.ctaHref || undefined },
  });
}

export async function deleteBanner(id: string) {
  return prisma.banner.delete({ where: { id } });
}
