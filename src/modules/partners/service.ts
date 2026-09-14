import "server-only";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import type { Prisma, PartnerStatus, PartnerType } from "@prisma/client";
import { prisma } from "@/server/db/client";
import { slugify } from "@/lib/utils/format";
import { notifications } from "@/server/notifications";
import type { AppRole } from "@/server/rbac/permissions";
import type { PartnerApplicationInput } from "@/lib/validations/partner";

export async function submitPartnerApplication(input: PartnerApplicationInput) {
  const application = await prisma.partnerApplication.create({
    data: {
      type: input.type,
      fullName: input.fullName,
      email: input.email.toLowerCase(),
      mobile: input.mobile,
      company: input.company,
      role: input.role,
      brokerNumber: input.brokerNumber,
      orn: input.orn,
      brokerage: input.brokerage,
      specialization: input.specialization,
      areas: input.areas,
      experienceYears: input.experienceYears,
      licenseInfo: input.licenseInfo,
      practiceCardInfo: input.practiceCardInfo,
      businessFocus: input.businessFocus,
      acceptedTerms: input.acceptedTerms,
      status: "PENDING_VERIFICATION",
    },
  });

  await notifications.email(
    { email: input.email },
    {
      subject: "Application received — DLD Independent Brokerage Partners",
      body: `Hi ${input.fullName}, we received your partner application and it is now Pending Verification. We'll follow up shortly.`,
      metadata: { applicationId: application.id },
    },
  );

  return application;
}

export async function listApplications(filters: { status?: PartnerStatus; page?: number; pageSize?: number }) {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const where: Prisma.PartnerApplicationWhereInput = filters.status ? { status: filters.status } : {};

  const [items, total] = await Promise.all([
    prisma.partnerApplication.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.partnerApplication.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getApplication(id: string) {
  return prisma.partnerApplication.findUnique({ where: { id }, include: { partner: true } });
}

async function uniqueBrokerSlug(name: string) {
  const base = slugify(name);
  let candidate = base || "broker";
  let counter = 1;
  while (await prisma.broker.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }
  return candidate;
}

async function uniqueDeveloperSlug(name: string) {
  const base = slugify(name);
  let candidate = base || "developer";
  let counter = 1;
  while (await prisma.developer.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }
  return candidate;
}

/** Maps a partner application type to the login role it should be granted. */
function roleForPartnerType(type: PartnerType): AppRole {
  switch (type) {
    case "INDEPENDENT_BROKER":
      return "BROKER";
    case "PROPERTY_OWNER":
      return "PROPERTY_OWNER";
    case "DEVELOPER":
      return "DEVELOPER";
    case "INVESTOR":
      return "INVESTOR";
    case "BROKERAGE_COMPANY":
    case "CORPORATE_PARTNER":
    case "SERVICE_PROVIDER":
    default:
      return "PARTNER_COMPANY";
  }
}

function generateTemporaryPassword() {
  return crypto.randomBytes(9).toString("base64url");
}

/**
 * Approving an application provisions a real login account (Tier 3/4
 * internal verification — never claims official DLD verification).
 */
async function provisionPartnerAccount(applicationId: string) {
  const application = await prisma.partnerApplication.findUniqueOrThrow({ where: { id: applicationId } });
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);

  const result = await prisma.$transaction(async (tx) => {
    const existingUser = await tx.user.findUnique({ where: { email: application.email } });
    const user =
      existingUser ??
      (await tx.user.create({
        data: {
          email: application.email,
          name: application.fullName,
          phone: application.mobile,
          passwordHash,
        },
      }));

    const isBrokerType = application.type === "INDEPENDENT_BROKER" || application.type === "BROKERAGE_COMPANY";
    const role = roleForPartnerType(application.type);

    await tx.userRole.upsert({
      where: { userId_role: { userId: user.id, role } },
      create: { userId: user.id, role },
      update: {},
    });

    const partner = await tx.partner.create({
      data: {
        type: application.type,
        status: "APPROVED",
        companyName: application.company ?? application.brokerage,
        mobile: application.mobile,
        email: application.email,
        brokerNumber: application.brokerNumber,
        orn: application.orn,
        specialization: application.specialization,
        areas: application.areas,
        experienceYears: application.experienceYears,
        acceptedTermsAt: application.acceptedTerms ? application.createdAt : null,
        verificationStatus: "PLATFORM_VERIFIED",
        lastVerifiedAt: new Date(),
        userId: user.id,
      },
    });

    if (isBrokerType) {
      const existingBroker = await tx.broker.findUnique({ where: { userId: user.id } });
      if (!existingBroker) {
        await tx.broker.create({
          data: {
            userId: user.id,
            partnerId: partner.id,
            slug: await uniqueBrokerSlug(application.fullName),
            name: application.fullName,
            specializations: application.businessFocus,
            areasServed: application.areas,
            experienceYears: application.experienceYears,
            brokerNumber: application.brokerNumber,
            orn: application.orn,
            verificationStatus: "PLATFORM_VERIFIED",
            lastVerifiedAt: new Date(),
          },
        });
      }
    }

    if (application.type === "DEVELOPER") {
      const existingDeveloper = await tx.developer.findUnique({ where: { partnerId: partner.id } });
      if (!existingDeveloper) {
        await tx.developer.create({
          data: {
            partnerId: partner.id,
            slug: await uniqueDeveloperSlug(application.company ?? application.fullName),
            name: application.company ?? application.fullName,
            verificationStatus: "PLATFORM_VERIFIED",
            lastVerifiedAt: new Date(),
          },
        });
      }
    }

    await tx.partnerApplication.update({
      where: { id: application.id },
      data: { partnerId: partner.id },
    });

    return { user, partner, isNewUser: !existingUser };
  });

  if (result.isNewUser) {
    await notifications.email(
      { email: application.email },
      {
        subject: "Your partner account is ready",
        body: `Welcome ${application.fullName}. Your application has been approved. Temporary login password: ${temporaryPassword}. Please sign in and note this is demo/development credential handling.`,
        metadata: { partnerId: result.partner.id },
      },
    );
  }

  return result;
}

export async function updateApplicationStatus(
  applicationId: string,
  status: PartnerStatus,
  reviewNotes: string | undefined,
) {
  const application = await prisma.partnerApplication.update({
    where: { id: applicationId },
    data: { status, reviewNotes },
  });

  if (status === "APPROVED" && !application.partnerId) {
    await provisionPartnerAccount(applicationId);
  }

  if (application.partnerId && (status === "APPROVED" || status === "SUSPENDED" || status === "REJECTED")) {
    await prisma.partner.update({
      where: { id: application.partnerId },
      data: { status },
    });
  }

  return prisma.partnerApplication.findUniqueOrThrow({ where: { id: applicationId } });
}

export async function listPartners(filters: { status?: PartnerStatus; page?: number; pageSize?: number }) {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const where: Prisma.PartnerWhereInput = filters.status ? { status: filters.status } : {};

  const [items, total] = await Promise.all([
    prisma.partner.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.partner.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getPartnerById(id: string) {
  return prisma.partner.findUnique({
    where: { id },
    include: { brokers: true, complianceDocuments: true, applications: true },
  });
}

export async function updatePartnerStatus(id: string, status: PartnerStatus) {
  return prisma.partner.update({ where: { id }, data: { status } });
}
