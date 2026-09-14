import { z } from "zod";

export const blogPostCreateSchema = z.object({
  title: z.string().trim().min(3).max(200),
  excerpt: z.string().trim().max(500).optional(),
  content: z.string().trim().min(10).max(20000),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
  seoTitle: z.string().trim().max(200).optional(),
  seoDescription: z.string().trim().max(300).optional(),
});

export const blogPostUpdateSchema = blogPostCreateSchema.partial().extend({
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

export type BlogPostCreateInput = z.infer<typeof blogPostCreateSchema>;
export type BlogPostUpdateInput = z.infer<typeof blogPostUpdateSchema>;

export const bannerCreateSchema = z.object({
  title: z.string().trim().min(2).max(200),
  subtitle: z.string().trim().max(300).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  ctaLabel: z.string().trim().max(60).optional(),
  ctaHref: z.string().trim().max(300).optional(),
  placement: z.string().trim().max(50).default("HOMEPAGE"),
  sortOrder: z.coerce.number().int().default(0),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
});

export const bannerUpdateSchema = bannerCreateSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type BannerCreateInput = z.infer<typeof bannerCreateSchema>;
export type BannerUpdateInput = z.infer<typeof bannerUpdateSchema>;
