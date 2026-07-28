import { PrismaClient, Role } from "@prisma/client";
import { hashPassword } from "../src/utils/bcrypt";

const prisma = new PrismaClient();

const marketers = [
  {
    fullName: "علی رحیمی",
    nationalId: "1010101010",
    referralCode: "MK-RAHIMI1",
    phone: "09121111111",
    city: "تهران",
    province: "تهران",
    jobTitle: "بازاریاب",
  },
  {
    fullName: "سارا کریمی",
    nationalId: "2020202020",
    referralCode: "MK-KARIMI2",
    phone: "09122222222",
    city: "اصفهان",
    province: "اصفهان",
    jobTitle: "بازاریاب",
  },
  {
    fullName: "حسین مرادی",
    nationalId: "3030303030",
    referralCode: "MK-MORADI3",
    phone: "09123333333",
    city: "شیراز",
    province: "فارس",
    jobTitle: "بازاریاب",
  },
] as const;

async function main() {
  const adminNationalId = process.env.ADMIN_NATIONAL_ID || "0000000000";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";
  const marketerPassword = process.env.MARKETER_PASSWORD || "Marketer@123";

  const adminHash = await hashPassword(adminPassword);
  const marketerHash = await hashPassword(marketerPassword);

  await prisma.user.upsert({
    where: { nationalId: adminNationalId },
    update: {},
    create: {
      fullName: "مدیر سیستم",
      nationalId: adminNationalId,
      jobTitle: "مدیر",
      role: Role.ADMIN,
      passwordHash: adminHash,
      phone: "09120000000",
      city: "تهران",
      province: "تهران",
    },
  });

  for (const marketer of marketers) {
    const user = await prisma.user.upsert({
      where: { nationalId: marketer.nationalId },
      update: {
        fullName: marketer.fullName,
        jobTitle: marketer.jobTitle,
        phone: marketer.phone,
        city: marketer.city,
        province: marketer.province,
      },
      create: {
        fullName: marketer.fullName,
        nationalId: marketer.nationalId,
        jobTitle: marketer.jobTitle,
        role: Role.MARKETER,
        passwordHash: marketerHash,
        phone: marketer.phone,
        city: marketer.city,
        province: marketer.province,
      },
    });

    await prisma.marketerProfile.upsert({
      where: { userId: user.id },
      update: { referralCode: marketer.referralCode },
      create: {
        userId: user.id,
        referralCode: marketer.referralCode,
      },
    });
  }

  const categories = [
    { slug: "ezharnameh", title: "اظهارنامه" },
    { slug: "gharardad", title: "قراردادنویسی" },
    { slug: "moshavareh", title: "مشاوره" },
    { slug: "layeheh", title: "لایحه" },
  ];

  for (const cat of categories) {
    await prisma.serviceCategory.upsert({
      where: { slug: cat.slug },
      update: { title: cat.title },
      create: cat,
    });
  }

  await prisma.discountCode.upsert({
    where: { code: "WELCOME100" },
    update: {},
    create: {
      code: "WELCOME100",
      percentOff: 100,
      firstTimeOnly: true,
      maxUses: 1000,
    },
  });

  console.log("Seed completed:");
  console.log(`  Admin nationalId: ${adminNationalId}`);
  console.log(`  Admin password: ${adminPassword}`);
  console.log(`  Marketer password: ${marketerPassword}`);
  console.log("  Marketers:");
  for (const marketer of marketers) {
    console.log(
      `    ${marketer.fullName} (${marketer.nationalId}) — ${marketer.referralCode}`
    );
  }
  console.log("  Categories: 4 service types");
  console.log("  Discount code: WELCOME100 (100% off, first time only)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
