import "server-only";
import { prisma } from "@/server/db/client";
import { slugify } from "@/lib/utils/format";
import type { ProjectCreateInput, ProjectUpdateInput, ProjectUnitCreateInput, ProjectUnitUpdateInput } from "@/lib/validations/developer";

export async function listDevelopers(filters: { page?: number; pageSize?: number } = {}) {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;

  const [items, total] = await Promise.all([
    prisma.developer.findMany({
      orderBy: { createdAt: "desc" },
      include: { projects: { where: { status: "PUBLISHED" }, take: 1 } },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.developer.count(),
  ]);

  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getDeveloperBySlug(slug: string) {
  return prisma.developer.findUnique({
    where: { slug },
    include: {
      projects: { where: { status: "PUBLISHED" }, include: { images: { take: 1 } }, orderBy: { createdAt: "desc" } },
    },
  });
}

export async function getDeveloperByPartnerId(partnerId: string) {
  return prisma.developer.findUnique({ where: { partnerId } });
}

async function uniqueProjectSlug(name: string) {
  const base = slugify(name);
  let candidate = base || "project";
  let counter = 1;
  while (await prisma.project.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }
  return candidate;
}

export async function listProjectsForDeveloper(developerId: string) {
  return prisma.project.findMany({
    where: { developerId },
    orderBy: { createdAt: "desc" },
    include: { units: true, images: true, _count: { select: { properties: true } } },
  });
}

export async function getProjectBySlug(slug: string, opts: { publicOnly?: boolean } = {}) {
  const publicOnly = opts.publicOnly ?? true;
  return prisma.project.findFirst({
    where: { slug, ...(publicOnly ? { status: "PUBLISHED" } : {}) },
    include: { developer: true, units: { orderBy: { price: "asc" } }, images: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function getProjectById(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: { developer: true, units: true, images: true },
  });
}

export async function createProject(developerId: string, input: ProjectCreateInput) {
  const slug = await uniqueProjectSlug(input.name);
  return prisma.project.create({
    data: {
      developerId,
      slug,
      name: input.name,
      description: input.description,
      community: input.community,
      city: input.city,
      completionDate: input.completionDate,
      brochureUrl: input.brochureUrl || undefined,
      amenities: input.amenities,
      status: "PENDING_REVIEW",
      images: { create: input.images.map((url, index) => ({ url, sortOrder: index })) },
    },
    include: { images: true },
  });
}

export async function updateProject(id: string, input: ProjectUpdateInput) {
  const { images, ...rest } = input;
  return prisma.project.update({
    where: { id },
    data: {
      ...rest,
      brochureUrl: input.brochureUrl || undefined,
      ...(images
        ? { images: { deleteMany: {}, create: images.map((url, index) => ({ url, sortOrder: index })) } }
        : {}),
    },
  });
}

export async function createProjectUnit(projectId: string, input: ProjectUnitCreateInput) {
  return prisma.projectUnit.create({
    data: {
      projectId,
      unitNumber: input.unitNumber,
      propertyType: input.propertyType,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      sizeSqft: input.sizeSqft,
      price: input.price,
      paymentPlan: input.paymentPlan,
    },
  });
}

export async function updateProjectUnit(id: string, input: ProjectUnitUpdateInput) {
  return prisma.projectUnit.update({ where: { id }, data: input });
}

export async function getProjectUnitById(id: string) {
  return prisma.projectUnit.findUnique({
    where: { id },
    include: { project: { include: { developer: true } } },
  });
}
