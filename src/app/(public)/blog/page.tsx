import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { listBlogPosts } from "@/modules/marketing/service";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Blog & Guides" };

export default async function BlogPage() {
  const posts = await listBlogPosts({ publicOnly: true });

  return (
    <div className="container-shell py-12">
      <h1 className="font-display text-3xl font-semibold text-charcoal">Blog &amp; Guides</h1>
      <p className="mt-2 max-w-2xl text-charcoal/60">Market insights, guides, and updates from our team.</p>

      {posts.length === 0 ? (
        <p className="mt-12 rounded-2xl border border-dashed border-charcoal/20 p-12 text-center text-charcoal/50">
          No articles published yet.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="focus-ring block rounded-2xl">
              <Card className="overflow-hidden transition-shadow hover:shadow-glass">
                {post.coverImageUrl && (
                  <div className="relative aspect-[16/9] w-full bg-charcoal/5">
                    <Image src={post.coverImageUrl} alt={post.title} fill className="object-cover" />
                  </div>
                )}
                <div className="p-5">
                  <p className="text-xs text-charcoal/50">{post.publishedAt ? formatDate(post.publishedAt) : ""}</p>
                  <h2 className="mt-1 font-display text-lg font-semibold text-charcoal">{post.title}</h2>
                  {post.excerpt && <p className="mt-2 text-sm text-charcoal/60">{post.excerpt}</p>}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
