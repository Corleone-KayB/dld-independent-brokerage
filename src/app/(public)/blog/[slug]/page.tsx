import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getBlogPostBySlug } from "@/modules/marketing/service";
import { formatDate } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: "Article" };
  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt || undefined,
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  return (
    <article className="container-shell max-w-3xl py-12">
      {post.coverImageUrl && (
        <div className="relative mb-8 aspect-[16/9] w-full overflow-hidden rounded-2xl bg-charcoal/5">
          <Image src={post.coverImageUrl} alt={post.title} fill className="object-cover" priority />
        </div>
      )}
      <p className="text-sm text-charcoal/50">{post.publishedAt ? formatDate(post.publishedAt) : ""}</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-charcoal">{post.title}</h1>
      <div className="mt-6 whitespace-pre-line text-charcoal/80">{post.content}</div>
    </article>
  );
}
