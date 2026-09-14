import { PrismaClient, type Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SEED_PASSWORD = process.env.SEED_USER_PASSWORD ?? "DldPartners#2026";

const UNSPLASH = {
  marina: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80",
  downtown: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=80",
  villa: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80",
  interior: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
  penthouse: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80",
  office: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80",
  broker1: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80",
  broker2: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80",
};

async function upsertUserWithRoles(input: {
  email: string;
  name: string;
  phone?: string;
  roles: Role[];
}) {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);
  const user = await prisma.user.upsert({
    where: { email: input.email },
    update: {},
    create: {
      email: input.email,
      name: input.name,
      phone: input.phone,
      passwordHash,
    },
  });

  for (const role of input.roles) {
    await prisma.userRole.upsert({
      where: { userId_role: { userId: user.id, role } },
      update: {},
      create: { userId: user.id, role },
    });
  }

  return user;
}

async function main() {
  console.log("Seeding demo data (this data is for development/evaluation only)...");

  // --- Admin / staff demo accounts ---
  const adminUser = await upsertUserWithRoles({ email: "admin@dldpartners.local", name: "Super Admin", roles: ["SUPER_ADMIN"] });
  await upsertUserWithRoles({ email: "compliance@dldpartners.local", name: "Compliance Manager", roles: ["COMPLIANCE_MANAGER"] });
  await upsertUserWithRoles({ email: "sales@dldpartners.local", name: "Sales Manager", roles: ["SALES_MANAGER"] });
  await upsertUserWithRoles({ email: "partner.manager@dldpartners.local", name: "Partner Manager", roles: ["PARTNER_MANAGER"] });

  // --- Demo brokerage partner + broker ---
  const brokerUser = await upsertUserWithRoles({
    email: "broker@dldpartners.local",
    name: "Ahmed Al Mansoori",
    phone: "+971501234567",
    roles: ["BROKER"],
  });

  const brokerPartner = await prisma.partner.upsert({
    where: { userId: brokerUser.id },
    update: {},
    create: {
      type: "INDEPENDENT_BROKER",
      status: "APPROVED",
      companyName: "Ahmed Al Mansoori Real Estate",
      mobile: "+971501234567",
      email: brokerUser.email,
      brokerNumber: "BRK-10234",
      orn: "ORN-5521",
      specialization: "Luxury & Investment",
      areas: ["Dubai Marina", "Downtown Dubai", "Palm Jumeirah"],
      experienceYears: 8,
      acceptedTermsAt: new Date(),
      verificationStatus: "PLATFORM_VERIFIED",
      lastVerifiedAt: new Date(),
      userId: brokerUser.id,
    },
  });

  const broker1 = await prisma.broker.upsert({
    where: { userId: brokerUser.id },
    update: {},
    create: {
      userId: brokerUser.id,
      partnerId: brokerPartner.id,
      slug: "ahmed-al-mansoori",
      name: "Ahmed Al Mansoori",
      photoUrl: UNSPLASH.broker1,
      bio: "Ahmed has 8 years of experience helping investors and end-users find premium properties across Dubai Marina, Downtown Dubai and Palm Jumeirah.",
      languages: ["English", "Arabic"],
      specializations: ["Luxury", "Investment", "Off-Plan"],
      areasServed: ["Dubai Marina", "Downtown Dubai", "Palm Jumeirah"],
      experienceYears: 8,
      brokerNumber: "BRK-10234",
      orn: "ORN-5521",
      verificationStatus: "PLATFORM_VERIFIED",
      lastVerifiedAt: new Date(),
      rating: 4.8,
    },
  });

  // --- Demo brokerage company partner + broker ---
  const companyUser = await upsertUserWithRoles({
    email: "company@dldpartners.local",
    name: "Layla Haddad",
    phone: "+971507654321",
    roles: ["PARTNER_COMPANY"],
  });

  const companyPartner = await prisma.partner.upsert({
    where: { userId: companyUser.id },
    update: {},
    create: {
      type: "BROKERAGE_COMPANY",
      status: "APPROVED",
      companyName: "Emirates Prime Brokerage",
      mobile: "+971507654321",
      email: companyUser.email,
      orn: "ORN-9981",
      specialization: "Residential Sales & Leasing",
      areas: ["Business Bay", "JVC", "Dubai Hills"],
      experienceYears: 12,
      acceptedTermsAt: new Date(),
      verificationStatus: "PLATFORM_VERIFIED",
      lastVerifiedAt: new Date(),
      userId: companyUser.id,
    },
  });

  const broker2 = await prisma.broker.upsert({
    where: { userId: companyUser.id },
    update: {},
    create: {
      userId: companyUser.id,
      partnerId: companyPartner.id,
      slug: "layla-haddad",
      name: "Layla Haddad",
      photoUrl: UNSPLASH.broker2,
      bio: "Layla leads Emirates Prime Brokerage's residential sales and leasing team, specializing in Business Bay, JVC and Dubai Hills.",
      languages: ["English", "Arabic", "French"],
      specializations: ["Sales", "Leasing", "Commercial"],
      areasServed: ["Business Bay", "JVC", "Dubai Hills"],
      experienceYears: 12,
      orn: "ORN-9981",
      verificationStatus: "PLATFORM_VERIFIED",
      lastVerifiedAt: new Date(),
      rating: 4.6,
    },
  });

  // --- Demo developer + off-plan project (Phase 2) ---
  const developerUser = await upsertUserWithRoles({
    email: "developer@dldpartners.local",
    name: "Nadia Al Farsi",
    phone: "+971503334455",
    roles: ["DEVELOPER"],
  });

  const developerPartner = await prisma.partner.upsert({
    where: { userId: developerUser.id },
    update: {},
    create: {
      type: "DEVELOPER",
      status: "APPROVED",
      companyName: "Meraas Demo Developer",
      mobile: "+971503334455",
      email: developerUser.email,
      acceptedTermsAt: new Date(),
      verificationStatus: "PLATFORM_VERIFIED",
      lastVerifiedAt: new Date(),
      userId: developerUser.id,
    },
  });

  const developer = await prisma.developer.upsert({
    where: { partnerId: developerPartner.id },
    update: {},
    create: {
      partnerId: developerPartner.id,
      slug: "meraas-demo-developer",
      name: "Meraas Demo Developer",
      description: "A demonstration developer profile showcasing an off-plan project pipeline. Demo data for development purposes.",
      verificationStatus: "PLATFORM_VERIFIED",
      lastVerifiedAt: new Date(),
    },
  });

  const demoProject = await prisma.project.upsert({
    where: { slug: "jvc-skyline-residences" },
    update: {},
    create: {
      developerId: developer.id,
      slug: "jvc-skyline-residences",
      name: "JVC Skyline Residences",
      description: "A demo off-plan residential project in JVC with a 60/40 payment plan and an expected 2028 handover.",
      status: "PUBLISHED",
      community: "JVC",
      city: "Dubai",
      completionDate: new Date("2028-06-01"),
      amenities: ["Pool", "Gym", "Kids Play Area", "Retail Podium"],
      images: { create: [{ url: UNSPLASH.marina, sortOrder: 0 }] },
    },
  });

  const existingUnits = await prisma.projectUnit.count({ where: { projectId: demoProject.id } });
  if (existingUnits === 0) {
    await prisma.projectUnit.createMany({
      data: [
        { projectId: demoProject.id, unitNumber: "A-101", propertyType: "APARTMENT", bedrooms: 1, bathrooms: 1, sizeSqft: 700, price: 920000, paymentPlan: "60/40" },
        { projectId: demoProject.id, unitNumber: "A-205", propertyType: "APARTMENT", bedrooms: 2, bathrooms: 2, sizeSqft: 1050, price: 1350000, paymentPlan: "60/40" },
        { projectId: demoProject.id, unitNumber: "A-310", propertyType: "APARTMENT", bedrooms: 3, bathrooms: 3, sizeSqft: 1500, price: 1890000, paymentPlan: "60/40" },
      ],
    });
  }

  // --- Demo properties ---
  const propertiesData = [
    {
      slug: "marina-view-2br-dubai-marina",
      title: "Marina View 2BR Apartment",
      description: "A bright 2-bedroom apartment with full marina views, walking distance to JBR beach and Marina Mall. Demo listing for development purposes.",
      purpose: "BUY" as const,
      propertyType: "APARTMENT" as const,
      status: "PUBLISHED" as const,
      price: 2350000,
      sizeSqft: 1180,
      bedrooms: 2,
      bathrooms: 2,
      furnishing: "Furnished",
      completionStatus: "Ready",
      community: "Dubai Marina",
      city: "Dubai",
      rentalYield: 6.4,
      roi: 7.1,
      amenities: ["Pool", "Gym", "Covered Parking", "Marina Views"],
      parkingSpaces: 1,
      verificationStatus: "PLATFORM_VERIFIED" as const,
      brokerId: broker1.id,
      partnerId: brokerPartner.id,
      images: [UNSPLASH.marina, UNSPLASH.interior],
    },
    {
      slug: "downtown-luxury-penthouse",
      title: "Downtown Luxury Penthouse",
      description: "An exceptional penthouse with Burj Khalifa views, private terrace and premium finishes. Demo listing for development purposes.",
      purpose: "LUXURY" as const,
      propertyType: "PENTHOUSE" as const,
      status: "PUBLISHED" as const,
      price: 8900000,
      sizeSqft: 3400,
      bedrooms: 4,
      bathrooms: 5,
      furnishing: "Unfurnished",
      completionStatus: "Ready",
      community: "Downtown Dubai",
      city: "Dubai",
      rentalYield: 4.8,
      roi: 5.5,
      amenities: ["Private Pool", "Burj Khalifa View", "Concierge", "Smart Home"],
      parkingSpaces: 3,
      verificationStatus: "PLATFORM_VERIFIED" as const,
      brokerId: broker1.id,
      partnerId: brokerPartner.id,
      images: [UNSPLASH.penthouse, UNSPLASH.downtown],
    },
    {
      slug: "business-bay-investment-studio",
      title: "Business Bay Investment Studio",
      description: "High-yield studio close to Dubai Canal, ideal for first-time investors. Demo listing for development purposes.",
      purpose: "INVESTMENT" as const,
      propertyType: "APARTMENT" as const,
      status: "PUBLISHED" as const,
      price: 780000,
      sizeSqft: 480,
      bedrooms: 0,
      bathrooms: 1,
      furnishing: "Semi-Furnished",
      completionStatus: "Ready",
      community: "Business Bay",
      city: "Dubai",
      rentalYield: 8.2,
      roi: 9.0,
      amenities: ["Pool", "Gym", "Canal Views"],
      parkingSpaces: 1,
      verificationStatus: "PLATFORM_VERIFIED" as const,
      brokerId: broker2.id,
      partnerId: companyPartner.id,
      images: [UNSPLASH.downtown, UNSPLASH.interior],
    },
    {
      slug: "arabian-ranches-family-villa",
      title: "Arabian Ranches Family Villa",
      description: "A spacious 4-bedroom villa with private garden in a gated family community. Demo listing for development purposes.",
      purpose: "RENT" as const,
      propertyType: "VILLA" as const,
      status: "PUBLISHED" as const,
      price: 3600000,
      rentalPrice: 220000,
      sizeSqft: 4200,
      bedrooms: 4,
      bathrooms: 4,
      furnishing: "Unfurnished",
      completionStatus: "Ready",
      community: "Arabian Ranches",
      city: "Dubai",
      rentalYield: 5.9,
      amenities: ["Private Garden", "Community Pool", "Gated Community"],
      parkingSpaces: 2,
      verificationStatus: "PLATFORM_VERIFIED" as const,
      brokerId: broker2.id,
      partnerId: companyPartner.id,
      images: [UNSPLASH.villa, UNSPLASH.interior],
    },
    {
      slug: "jvc-off-plan-1br",
      title: "JVC Off-Plan 1BR with Payment Plan",
      description: "Off-plan 1-bedroom apartment with an attractive 60/40 payment plan, expected handover 2028. Demo listing for development purposes.",
      purpose: "OFF_PLAN" as const,
      propertyType: "APARTMENT" as const,
      status: "PUBLISHED" as const,
      price: 950000,
      sizeSqft: 720,
      bedrooms: 1,
      bathrooms: 1,
      furnishing: "Unfurnished",
      completionStatus: "Off-Plan",
      community: "JVC",
      city: "Dubai",
      developerName: "Meraas Demo Developer",
      paymentPlan: "60/40",
      rentalYield: 7.0,
      amenities: ["Pool", "Gym", "Kids Play Area"],
      parkingSpaces: 1,
      verificationStatus: "PLATFORM_VERIFIED" as const,
      brokerId: broker1.id,
      partnerId: brokerPartner.id,
      images: [UNSPLASH.marina, UNSPLASH.downtown],
    },
    {
      slug: "difc-commercial-office",
      title: "DIFC Grade A Commercial Office",
      description: "Fitted Grade A office space in DIFC, ideal for financial and professional services firms. Demo listing for development purposes.",
      purpose: "COMMERCIAL" as const,
      propertyType: "OFFICE" as const,
      status: "PUBLISHED" as const,
      price: 5200000,
      sizeSqft: 2600,
      furnishing: "Fitted",
      completionStatus: "Ready",
      community: "DIFC",
      city: "Dubai",
      rentalYield: 7.5,
      amenities: ["24/7 Access", "Meeting Rooms", "Reception"],
      parkingSpaces: 6,
      verificationStatus: "PLATFORM_VERIFIED" as const,
      brokerId: broker2.id,
      partnerId: companyPartner.id,
      images: [UNSPLASH.office],
    },
  ];

  for (const data of propertiesData) {
    const { images, ...rest } = data;
    await prisma.property.upsert({
      where: { slug: data.slug },
      update: {},
      create: {
        ...rest,
        images: { create: images.map((url, index) => ({ url, sortOrder: index })) },
      },
    });
  }

  // --- Demo client, lead, activity, appointment for the CRM ---
  const demoClient = await prisma.client.upsert({
    where: { id: "seed-client-demo" },
    update: {},
    create: {
      id: "seed-client-demo",
      partnerId: brokerPartner.id,
      name: "Fatima Al Suwaidi",
      phone: "+971509998877",
      email: "fatima.demo@example.com",
      nationality: "UAE",
      intent: "Investment",
      budget: 2500000,
      preferredLocations: ["Dubai Marina", "Business Bay", "JVC"],
      propertyRequirements: "2-bedroom apartment with strong rental yield",
      financingStatus: "Pre-approved",
      leadSource: "Website",
    },
  });

  const marina2br = await prisma.property.findUnique({ where: { slug: "marina-view-2br-dubai-marina" } });

  const demoLead = await prisma.lead.upsert({
    where: { id: "seed-lead-demo" },
    update: {},
    create: {
      id: "seed-lead-demo",
      partnerId: brokerPartner.id,
      clientId: demoClient.id,
      propertyId: marina2br?.id,
      brokerId: broker1.id,
      source: "Website enquiry",
      status: "QUALIFIED",
      temperature: "HOT",
      score: 82,
      message: "Interested in a 2-bedroom investment property with strong rental yield.",
      budget: 2500000,
    },
  });

  await prisma.activity.upsert({
    where: { id: "seed-activity-demo" },
    update: {},
    create: {
      id: "seed-activity-demo",
      partnerId: brokerPartner.id,
      clientId: demoClient.id,
      leadId: demoLead.id,
      userId: brokerUser.id,
      type: "CALL",
      note: "Called to confirm budget and preferred move-in timeline. Client is pre-approved and ready to view.",
    },
  });

  await prisma.appointment.upsert({
    where: { id: "seed-appointment-demo" },
    update: {},
    create: {
      id: "seed-appointment-demo",
      partnerId: brokerPartner.id,
      clientId: demoClient.id,
      brokerId: broker1.id,
      propertyId: marina2br?.id,
      startsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: "SCHEDULED",
      notes: "Viewing for Marina View 2BR Apartment.",
    },
  });

  // --- Demo compliance documents ---
  await prisma.complianceDocument.upsert({
    where: { id: "seed-compliance-doc-1" },
    update: {},
    create: {
      id: "seed-compliance-doc-1",
      partnerId: brokerPartner.id,
      type: "BROKER_CARD",
      name: "Broker Practice Card 2026 (demo)",
      storageKey: "compliance/seed/demo-broker-card.txt",
      mimeType: "text/plain",
      expiresAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      verificationStatus: "PLATFORM_VERIFIED",
      verifiedAt: new Date(),
    },
  });

  await prisma.complianceDocument.upsert({
    where: { id: "seed-compliance-doc-2" },
    update: {},
    create: {
      id: "seed-compliance-doc-2",
      partnerId: companyPartner.id,
      type: "TRADE_LICENSE",
      name: "Trade License (demo, pending review)",
      storageKey: "compliance/seed/demo-trade-license.txt",
      mimeType: "text/plain",
      expiresAt: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000),
      verificationStatus: "PENDING",
    },
  });

  // --- Demo deal + commission (Phase 2) ---
  const downtownPenthouse = await prisma.property.findUnique({ where: { slug: "downtown-luxury-penthouse" } });
  const demoDeal = await prisma.deal.upsert({
    where: { id: "seed-deal-demo" },
    update: {},
    create: {
      id: "seed-deal-demo",
      partnerId: brokerPartner.id,
      clientId: demoClient.id,
      propertyId: downtownPenthouse?.id,
      brokerId: broker1.id,
      stage: "COMMISSION",
      value: downtownPenthouse?.price,
      notes: "Demo deal progressed to the commission stage.",
    },
  });

  await prisma.commission.upsert({
    where: { id: "seed-commission-demo" },
    update: {},
    create: {
      id: "seed-commission-demo",
      dealId: demoDeal.id,
      partnerId: brokerPartner.id,
      brokerId: broker1.id,
      amount: downtownPenthouse ? Number(downtownPenthouse.price) * 0.02 : 178000,
      status: "EXPECTED",
    },
  });

  // --- Demo blog post + banner (Phase 2 automated marketing) ---
  await prisma.blogPost.upsert({
    where: { slug: "dubai-marina-investment-guide" },
    update: {},
    create: {
      slug: "dubai-marina-investment-guide",
      title: "Dubai Marina Investment Guide 2026 (Demo)",
      excerpt: "A demo guide covering yields, community overview and buyer considerations in Dubai Marina.",
      content:
        "This is demo blog content for development and evaluation purposes.\n\nDubai Marina remains one of Dubai's most established rental markets, with strong demand from both tenants and investors.\n\nUse the Investor Hub calculators to model your own returns before making a decision.",
      coverImageUrl: UNSPLASH.marina,
      status: "PUBLISHED",
      publishedAt: new Date(),
      authorId: adminUser.id,
    },
  });

  await prisma.banner.upsert({
    where: { id: "seed-banner-demo" },
    update: {},
    create: {
      id: "seed-banner-demo",
      title: "New: Off-Plan Projects Now Live",
      subtitle: "Browse verified developer projects with transparent payment plans.",
      ctaLabel: "View Developers",
      ctaHref: "/developers",
      placement: "HOMEPAGE",
      isActive: true,
      sortOrder: 0,
    },
  });

  // --- A pending partner application to demonstrate the review workflow ---
  await prisma.partnerApplication.upsert({
    where: { id: "seed-application-demo" },
    update: {},
    create: {
      id: "seed-application-demo",
      type: "INDEPENDENT_BROKER",
      fullName: "Omar Khalidi",
      email: "omar.demo@example.com",
      mobile: "+971502223344",
      brokerNumber: "BRK-88231",
      orn: "ORN-3312",
      brokerage: "Independent",
      specialization: "Residential Leasing",
      areas: ["Al Barsha", "Jumeirah"],
      experienceYears: 3,
      licenseInfo: "DED Trade License #DEMO-1123",
      practiceCardInfo: "Trakheesi Practice Card #DEMO-9981",
      businessFocus: ["Leasing", "Sales"],
      acceptedTerms: true,
      status: "PENDING_VERIFICATION",
    },
  });

  console.log("Seed complete.");
  console.log(`Demo accounts use the password from SEED_USER_PASSWORD (default shown in .env.example).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
