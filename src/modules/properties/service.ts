import "server-only";
import { Prisma, type PropertyStatus } from "@prisma/client";
import { prisma } from "@/server/db/client";
import { slugify } from "@/lib/utils/format";
import type { PropertySearchInput, PropertyCreateInput, PropertyUpdateInput } from "@/lib/validations/property";

function buildWhere(input: Partial<PropertySearchInput>, { publicOnly }: { publicOnly: boolean }) {
  const where: Prisma.PropertyWhereInput = {};
  if (publicOnly) where.status = "PUBLISHED";

  if (input.purpose) where.purpose = input.purpose;
  if (input.propertyType) where.propertyType = input.propertyType;
  if (input.community) where.community = { contains: input.community, mode: "insensitive" };
  if (input.location) {
    where.OR = [
      { community: { contains: input.location, mode: "insensitive" } },
      { city: { contains: input.location, mode: "insensitive" } },
      { building: { contains: input.location, mode: "insensitive" } },
    ];
  }
  if (input.furnishing) where.furnishing = { equals: input.furnishing, mode: "insensitive" };
  if (input.completionStatus) where.completionStatus = { equals: input.completionStatus, mode: "insensitive" };
  if (input.minPrice || input.maxPrice) {
    where.price = {
      ...(input.minPrice ? { gte: input.minPrice } : {}),
      ...(input.maxPrice ? { lte: input.maxPrice } : {}),
    };
  }
  if (input.minBedrooms || input.maxBedrooms) {
    where.bedrooms = {
      ...(input.minBedrooms !== undefined ? { gte: input.minBedrooms } : {}),
      ...(input.maxBedrooms !== undefined ? { lte: input.maxBedrooms } : {}),
    };
  }
  if (input.minBathrooms || input.maxBathrooms) {
    where.bathrooms = {
      ...(input.minBathrooms !== undefined ? { gte: input.minBathrooms } : {}),
      ...(input.maxBathrooms !== undefined ? { lte: input.maxBathrooms } : {}),
    };
  }
  if (input.minSize || input.maxSize) {
    where.sizeSqft = {
      ...(input.minSize ? { gte: input.minSize } : {}),
      ...(input.maxSize ? { lte: input.maxSize } : {}),
    };
  }
  if (input.minYield) where.rentalYield = { gte: input.minYield };

  return where;
}

export async function searchProperties(
  input: PropertySearchInput,
  opts: { publicOnly?: boolean } = {},
) {
  const publicOnly = opts.publicOnly ?? true;
  const where = buildWhere(input, { publicOnly });
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 12;

  const [items, total] = await Promise.all([
    prisma.property.findMany({
      where,
      include: { images: { orderBy: { sortOrder: "asc" } }, broker: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.property.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getPropertyBySlug(slug: string, opts: { publicOnly?: boolean } = {}) {
  const publicOnly = opts.publicOnly ?? true;
  return prisma.property.findFirst({
    where: { slug, ...(publicOnly ? { status: "PUBLISHED" as PropertyStatus } : {}) },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      broker: true,
      partner: true,
    },
  });
}

export async function getSimilarProperties(propertyId: string, community: string | null, purpose: string) {
  return prisma.property.findMany({
    where: {
      status: "PUBLISHED",
      id: { not: propertyId },
      purpose: purpose as never,
      ...(community ? { community } : {}),
    },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    take: 3,
  });
}

async function uniqueSlug(title: string) {
  const base = slugify(title);
  let candidate = base;
  let counter = 1;
  while (await prisma.property.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }
  return candidate;
}

export async function createProperty(
  input: PropertyCreateInput,
  ctx: { partnerId: string | null; brokerId: string | null },
) {
  const slug = await uniqueSlug(input.title);
  return prisma.property.create({
    data: {
      slug,
      title: input.title,
      description: input.description,
      purpose: input.purpose,
      propertyType: input.propertyType,
      price: input.price,
      rentalPrice: input.rentalPrice,
      sizeSqft: input.sizeSqft,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      furnishing: input.furnishing,
      completionStatus: input.completionStatus,
      community: input.community,
      building: input.building,
      city: input.city,
      developerName: input.developerName,
      serviceCharge: input.serviceCharge,
      rentalYield: input.rentalYield,
      roi: input.roi,
      paymentPlan: input.paymentPlan,
      amenities: input.amenities,
      view: input.view,
      parkingSpaces: input.parkingSpaces,
      partnerId: ctx.partnerId,
      brokerId: input.brokerId ?? ctx.brokerId,
      status: "PENDING_REVIEW",
      images: {
        create: input.images.map((url, index) => ({ url, sortOrder: index })),
      },
    },
    include: { images: true },
  });
}

export async function updateProperty(id: string, input: PropertyUpdateInput) {
  const { images, ...rest } = input;
  return prisma.property.update({
    where: { id },
    data: {
      ...rest,
      ...(images
        ? {
            images: {
              deleteMany: {},
              create: images.map((url, index) => ({ url, sortOrder: index })),
            },
          }
        : {}),
    },
    include: { images: true },
  });
}

export async function deleteProperty(id: string) {
  return prisma.property.delete({ where: { id } });
}

export async function getPropertyById(id: string) {
  return prisma.property.findUnique({ include: { images: true, broker: true, partner: true }, where: { id } });
}
