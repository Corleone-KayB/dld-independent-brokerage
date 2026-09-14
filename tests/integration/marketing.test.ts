import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "@/server/db/client";
import { listBlogPosts, getBlogPostBySlug, listActiveBanners, createBanner, updateBanner } from "@/modules/marketing/service";

describe("Automated Marketing integration (requires local Postgres + seed data)", () => {
  const createdBannerIds: string[] = [];

  afterAll(async () => {
    await prisma.banner.deleteMany({ where: { id: { in: createdBannerIds } } });
    await prisma.$disconnect();
  });

  it("lists only published blog posts publicly", async () => {
    const posts = await listBlogPosts({ publicOnly: true });
    expect(posts.every((p) => p.status === "PUBLISHED")).toBe(true);
    expect(posts.some((p) => p.slug === "dubai-marina-investment-guide")).toBe(true);
  });

  it("hides a draft post from public lookup by slug", async () => {
    const draft = await prisma.blogPost.create({
      data: { slug: "draft-only-post-test", title: "Draft", content: "content", status: "DRAFT" },
    });
    const found = await getBlogPostBySlug("draft-only-post-test", { publicOnly: true });
    expect(found).toBeNull();
    await prisma.blogPost.delete({ where: { id: draft.id } });
  });

  it("lists only currently-active banners for a placement", async () => {
    const banners = await listActiveBanners("HOMEPAGE");
    expect(banners.every((b) => b.isActive)).toBe(true);
    expect(banners.some((b) => b.id === "seed-banner-demo")).toBe(true);
  });

  it("excludes an inactive banner from the active listing", async () => {
    const banner = await createBanner({ title: "Inactive test banner", placement: "HOMEPAGE", sortOrder: 99 });
    createdBannerIds.push(banner.id);
    await updateBanner(banner.id, { isActive: false });

    const active = await listActiveBanners("HOMEPAGE");
    expect(active.some((b) => b.id === banner.id)).toBe(false);
  });

  it("excludes a banner whose end date has already passed", async () => {
    const banner = await createBanner({
      title: "Expired test banner",
      placement: "HOMEPAGE",
      sortOrder: 99,
      endsAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    });
    createdBannerIds.push(banner.id);

    const active = await listActiveBanners("HOMEPAGE");
    expect(active.some((b) => b.id === banner.id)).toBe(false);
  });
});
