import type { Metadata } from "next";
import { listBlogPosts, listAllBanners } from "@/modules/marketing/service";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewBlogPostForm } from "@/components/admin/new-blog-post-form";
import { BlogPostStatusActions } from "@/components/admin/blog-post-status-actions";
import { NewBannerForm } from "@/components/admin/new-banner-form";
import { BannerToggle } from "@/components/admin/banner-toggle";
import { formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Marketing" };

export default async function AdminMarketingPage() {
  const [posts, banners] = await Promise.all([listBlogPosts({ publicOnly: false }), listAllBanners()]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal">Marketing</h1>
        <p className="mt-1 text-charcoal/60">Manage the blog and homepage banners.</p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-charcoal">Blog Posts</h2>
          <NewBlogPostForm />
        </div>
        {posts.length === 0 ? (
          <Card className="p-10 text-center text-charcoal/50">No posts yet.</Card>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <Card key={post.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium text-charcoal">{post.title}</p>
                  <p className="text-xs text-charcoal/50">
                    {post.status === "PUBLISHED" && post.publishedAt ? `Published ${formatDate(post.publishedAt)}` : "Draft"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={post.status === "PUBLISHED" ? "success" : "neutral"}>{post.status}</Badge>
                  <BlogPostStatusActions postId={post.id} currentStatus={post.status} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-charcoal">Homepage Banners</h2>
          <NewBannerForm />
        </div>
        {banners.length === 0 ? (
          <Card className="p-10 text-center text-charcoal/50">No banners yet.</Card>
        ) : (
          <div className="space-y-3">
            {banners.map((banner) => (
              <Card key={banner.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium text-charcoal">{banner.title}</p>
                  <p className="text-xs text-charcoal/50">{banner.subtitle}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={banner.isActive ? "success" : "neutral"}>{banner.isActive ? "Active" : "Inactive"}</Badge>
                  <BannerToggle bannerId={banner.id} isActive={banner.isActive} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
